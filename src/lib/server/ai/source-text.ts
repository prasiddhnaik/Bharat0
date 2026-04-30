import { createHash } from 'node:crypto';
import * as cheerio from 'cheerio';
import { PDFParse } from 'pdf-parse';
import type { Bill } from '$lib/domain/types';
import type { createPrismaClient } from '$lib/server/db/prisma';

const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_STORED_TEXT_CHARS = 120_000;
const MAX_ANALYSIS_EXCERPT_CHARS = 16_000;
const FAILURE_CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const SOURCE_TEXT_VERSION = 'source-text-v1';
const MAX_DISCOVERED_PDF_CANDIDATES = 8;

type PrismaSourceTextClient = Pick<ReturnType<typeof createPrismaClient>, 'billSourceText'>;

type SourceExtractionResult = {
	status: BillSourceTextForAnalysis['status'];
	resolvedUrl?: string;
	contentType?: string;
	byteLength?: number;
	text?: string;
	textHash?: string;
	error?: string;
};

type BufferedSource = {
	buffer: Buffer;
	contentType?: string;
	byteLength: number;
	resolvedUrl: string;
};

export type BillSourceTextForAnalysis = {
	version: typeof SOURCE_TEXT_VERSION;
	status: 'extracted' | 'not_pdf' | 'unavailable' | 'empty' | 'too_large';
	sourceUrl: string;
	resolvedUrl?: string;
	contentType?: string;
	byteLength?: number;
	characterCount?: number;
	textHash?: string;
	excerpt?: string;
	error?: string;
};

export type BillSourceTextMetadata = Omit<BillSourceTextForAnalysis, 'excerpt'>;

export function getBillSourceTextMetadata(sourceText?: BillSourceTextForAnalysis): BillSourceTextMetadata | undefined {
	if (!sourceText) return undefined;
	const { excerpt: _excerpt, ...metadata } = sourceText;
	return metadata;
}

export async function getBillSourceTextForAnalysis(prisma: PrismaSourceTextClient, bill: Bill): Promise<BillSourceTextForAnalysis> {
	const sourceUrl = normalizeSourceUrl(bill.source_url);
	if (!sourceUrl) {
		return { version: SOURCE_TEXT_VERSION, status: 'unavailable', sourceUrl: bill.source_url, error: 'No source URL is available.' };
	}

	const cached = await prisma.billSourceText.findUnique({ where: { source_url: sourceUrl } });
	if (cached?.status === 'extracted' && cached.text.trim()) {
		return buildAnalysisContext({
			status: 'extracted',
			sourceUrl,
			resolvedUrl: cached.resolved_url ?? undefined,
			contentType: cached.content_type ?? undefined,
			byteLength: cached.byte_length ?? undefined,
			text: cached.text,
			textHash: cached.text_hash ?? hashText(cached.text)
		});
	}

	if (cached?.status !== 'extracted' && cached?.updated_at && Date.now() - cached.updated_at.getTime() < FAILURE_CACHE_TTL_MS) {
		return {
			version: SOURCE_TEXT_VERSION,
			status: coerceStatus(cached.status),
			sourceUrl,
			resolvedUrl: cached.resolved_url ?? undefined,
			contentType: cached.content_type ?? undefined,
			byteLength: cached.byte_length ?? undefined,
			characterCount: cached.char_count,
			textHash: cached.text_hash ?? undefined,
			error: cached.error ?? undefined
		};
	}

	const extracted = await fetchAndExtractPdfText(sourceUrl);
	const extractedText = extracted.status === 'extracted' || extracted.status === 'empty' ? extracted.text : undefined;
	await prisma.billSourceText.upsert({
		where: { source_url: sourceUrl },
		create: {
			bill_id: bill.id,
			source_url: sourceUrl,
			resolved_url: extracted.resolvedUrl,
			content_type: extracted.contentType,
			byte_length: extracted.byteLength,
			char_count: extractedText?.length ?? 0,
			text_hash: extracted.textHash,
			text: extractedText ?? '',
			status: extracted.status,
			error: extracted.error
		},
		update: {
			bill_id: bill.id,
			resolved_url: extracted.resolvedUrl,
			content_type: extracted.contentType,
			byte_length: extracted.byteLength,
			char_count: extractedText?.length ?? 0,
			text_hash: extracted.textHash,
			text: extractedText ?? '',
			status: extracted.status,
			error: extracted.error,
			extracted_at: new Date()
		}
	});

	if (extracted.status === 'extracted' && extracted.text) {
		return buildAnalysisContext({
			status: 'extracted',
			sourceUrl,
			resolvedUrl: extracted.resolvedUrl,
			contentType: extracted.contentType,
			byteLength: extracted.byteLength,
			text: extracted.text,
			textHash: extracted.textHash
		});
	}

	return {
		version: SOURCE_TEXT_VERSION,
		status: coerceStatus(extracted.status),
		sourceUrl,
		resolvedUrl: extracted.resolvedUrl,
		contentType: extracted.contentType,
		byteLength: extracted.byteLength,
		characterCount: extractedText?.length ?? 0,
		textHash: extracted.textHash,
		error: extracted.error
	};
}

async function fetchAndExtractPdfText(sourceUrl: string): Promise<SourceExtractionResult> {
	try {
		const sourceResponse = await fetchBufferedSource(sourceUrl);
		if ('status' in sourceResponse) return sourceResponse;

		const directPdf = await extractPdfBuffer(sourceResponse, sourceUrl);
		if (directPdf.status === 'extracted' || directPdf.status === 'empty' || directPdf.status === 'too_large') return directPdf;

		const candidates = discoverPdfLinks(sourceResponse.buffer.toString('utf8'), sourceUrl);
		for (const candidateUrl of candidates) {
			const candidateResponse = await fetchBufferedSource(candidateUrl);
			if ('status' in candidateResponse) continue;
			const candidatePdf = await extractPdfBuffer(candidateResponse, sourceUrl, candidateUrl);
			if (candidatePdf.status === 'extracted' || candidatePdf.status === 'empty' || candidatePdf.status === 'too_large') return candidatePdf;
		}

		return {
			status: 'not_pdf' as const,
			resolvedUrl: sourceUrl,
			contentType: sourceResponse.contentType,
			byteLength: sourceResponse.buffer.byteLength,
			error: candidates.length > 0
				? `Found ${candidates.length} possible PDF link(s), but none returned a readable PDF.`
				: 'Source URL did not return a PDF and no PDF links were found in the HTML.'
		};
	} catch (error) {
		return {
			status: 'unavailable' as const,
			error: error instanceof Error ? error.message : 'Unable to fetch or parse source PDF.'
		};
	}
}

async function fetchBufferedSource(sourceUrl: string): Promise<BufferedSource | SourceExtractionResult> {
	const response = await fetchWithTimeout(sourceUrl);
	const contentType = response.headers.get('content-type') ?? undefined;
	const contentLengthHeader = response.headers.get('content-length');
	const byteLengthFromHeader = contentLengthHeader ? Number.parseInt(contentLengthHeader, 10) : undefined;

	if (!response.ok) {
		return { status: 'unavailable' as const, contentType, byteLength: byteLengthFromHeader, resolvedUrl: sourceUrl, error: `Source returned HTTP ${response.status}.` };
	}

	if (byteLengthFromHeader && byteLengthFromHeader > MAX_SOURCE_BYTES) {
		return { status: 'too_large' as const, contentType, byteLength: byteLengthFromHeader, resolvedUrl: sourceUrl, error: 'Source is larger than the configured extraction limit.' };
	}

	const buffer = Buffer.from(await response.arrayBuffer());
	if (buffer.byteLength > MAX_SOURCE_BYTES) {
		return { status: 'too_large' as const, contentType, byteLength: buffer.byteLength, resolvedUrl: sourceUrl, error: 'Source is larger than the configured extraction limit.' };
	}

	return { buffer, contentType, byteLength: buffer.byteLength, resolvedUrl: sourceUrl };
}

async function extractPdfBuffer(
	source: BufferedSource,
	originalSourceUrl: string,
	resolvedUrl = source.resolvedUrl
): Promise<SourceExtractionResult> {
	if (!looksLikePdf(resolvedUrl, source.contentType, source.buffer)) {
		return { status: 'not_pdf' as const, contentType: source.contentType, byteLength: source.byteLength, resolvedUrl };
	}

	const text = await parsePdfText(source.buffer);
	if (!text.trim()) {
		return {
			status: 'empty' as const,
			contentType: source.contentType,
			byteLength: source.byteLength,
			resolvedUrl,
			text: '',
			textHash: hashText(''),
			error: `PDF text extraction returned no readable text from ${resolvedUrl === originalSourceUrl ? 'the source URL' : 'the discovered PDF link'}.`
		};
	}

	const storedText = text.slice(0, MAX_STORED_TEXT_CHARS);
	return {
		status: 'extracted' as const,
		contentType: source.contentType,
		byteLength: source.byteLength,
		resolvedUrl,
		text: storedText,
		textHash: hashText(storedText)
	};
}

async function fetchWithTimeout(sourceUrl: string) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 20_000);
	try {
		return await fetch(sourceUrl, {
			headers: {
				'user-agent': 'Mozilla/5.0 BharatZero/0.1',
				'accept-language': 'en-IN,en;q=0.9',
				accept: 'application/pdf,text/html,text/plain,*/*'
			},
			signal: controller.signal
		});
	} finally {
		clearTimeout(timeout);
	}
}

async function parsePdfText(buffer: Buffer) {
	const parser = new PDFParse({ data: buffer });
	try {
		const result = await parser.getText({ lineEnforce: true, pageJoiner: '\n\n' });
		return normalizeText(result.text);
	} finally {
		await parser.destroy();
	}
}

function buildAnalysisContext(input: {
	status: 'extracted';
	sourceUrl: string;
	resolvedUrl?: string;
	contentType?: string;
	byteLength?: number;
	text: string;
	textHash?: string;
}): BillSourceTextForAnalysis {
	const textHash = input.textHash ?? hashText(input.text);
	return {
		version: SOURCE_TEXT_VERSION,
		status: 'extracted',
		sourceUrl: input.sourceUrl,
		resolvedUrl: input.resolvedUrl,
		contentType: input.contentType,
		byteLength: input.byteLength,
		characterCount: input.text.length,
		textHash,
		excerpt: buildExcerpt(input.text)
	};
}

function discoverPdfLinks(html: string, sourceUrl: string) {
	const candidates = new Set<string>();
	const $ = cheerio.load(html);

	$('a[href], area[href], iframe[src], embed[src], object[data]').each((_index, element) => {
		for (const attribute of ['href', 'src', 'data']) {
			const value = $(element).attr(attribute);
			if (value) addCandidate(candidates, value, sourceUrl);
		}
	});

	$('[data-file], [data-pdf], [data-url], [data-src], [data-href], [onclick]').each((_index, element) => {
		for (const attribute of ['data-file', 'data-pdf', 'data-url', 'data-src', 'data-href', 'onclick']) {
			const value = $(element).attr(attribute);
			if (value) extractCandidateStrings(value).forEach((candidate) => addCandidate(candidates, candidate, sourceUrl));
		}
	});

	extractCandidateStrings(html).forEach((candidate) => addCandidate(candidates, candidate, sourceUrl));

	return [...candidates]
		.sort((left, right) => scorePdfCandidate(right) - scorePdfCandidate(left))
		.slice(0, MAX_DISCOVERED_PDF_CANDIDATES);
}

function extractCandidateStrings(value: string) {
	const matches = value.matchAll(/(?:https?:\/\/[^"'<>\\\s]+|\/[^"'<>\\\s]*)(?:\.pdf|\/getFile\/|\/BillsTexts\/|\/BillsPDFFiles\/)[^"'<>\\\s]*/gi);
	return [...matches].map((match) => decodeHtmlEntities(match[0]));
}

function addCandidate(candidates: Set<string>, value: string, sourceUrl: string) {
	const cleaned = decodeHtmlEntities(value).trim();
	if (!isPdfLikeCandidate(cleaned)) return;

	try {
		candidates.add(new URL(cleaned, sourceUrl).toString());
	} catch {
		// Ignore malformed URLs from inline scripts.
	}
}

function isPdfLikeCandidate(value: string) {
	return /\.pdf(?:[?#].*)?$/i.test(value) || /\/getFile\//i.test(value) || /\/BillsTexts\//i.test(value) || /\/BillsPDFFiles\//i.test(value);
}

function scorePdfCandidate(url: string) {
	let score = 0;
	if (/\.pdf(?:[?#].*)?$/i.test(url)) score += 30;
	if (/\/BillsTexts\//i.test(url)) score += 20;
	if (/Asintroduced|PassedBothHouses|AsPassed/i.test(url)) score += 10;
	if (/source=legislation/i.test(url)) score += 8;
	if (/getFile/i.test(url)) score += 5;
	return score;
}

function decodeHtmlEntities(value: string) {
	return value
		.replace(/&amp;/gi, '&')
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>');
}

function buildExcerpt(text: string) {
	const normalized = normalizeText(text);
	const sections = [
		extractWindow(normalized, /statement\s+of\s+objects\s+and\s+reasons/i, 7000),
		extractWindow(normalized, /\bA\s+BILL\b/i, 5000),
		extractWindow(normalized, /\bBE\s+it\s+enacted\b/i, 5000)
	].filter(Boolean);

	const combined = sections.length > 0 ? sections.join('\n\n---\n\n') : normalized;
	return combined.slice(0, MAX_ANALYSIS_EXCERPT_CHARS);
}

function extractWindow(text: string, pattern: RegExp, maxChars: number) {
	const match = pattern.exec(text);
	if (!match || typeof match.index !== 'number') return '';
	const start = Math.max(0, match.index - 600);
	return text.slice(start, start + maxChars).trim();
}

function normalizeSourceUrl(sourceUrl: string) {
	try {
		return new URL(sourceUrl).toString();
	} catch {
		return '';
	}
}

function normalizeText(text: string) {
	return text
		.replace(/\r/g, '\n')
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.replace(/[ \t]{2,}/g, ' ')
		.trim();
}

function looksLikePdf(sourceUrl: string, contentType: string | undefined, buffer: Buffer) {
	return contentType?.toLowerCase().includes('application/pdf') || /\.pdf(?:[?#].*)?$/i.test(sourceUrl) || buffer.subarray(0, 4).toString('latin1') === '%PDF';
}

function hashText(text: string) {
	return createHash('sha256').update(text).digest('hex');
}

function coerceStatus(status: string): BillSourceTextForAnalysis['status'] {
	if (status === 'extracted' || status === 'not_pdf' || status === 'empty' || status === 'too_large') return status;
	return 'unavailable';
}
