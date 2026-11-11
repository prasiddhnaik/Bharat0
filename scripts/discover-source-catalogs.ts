import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fetchResponse, runCli } from './lib/refresh';
import * as cheerio from 'cheerio';
import {
	sourceDiscoveryTargets,
	summarizeDiscoveryTargets,
	type SourceDiscoveryResult,
	type SourceDiscoveryTarget
} from '../src/lib/ingestion/source-discovery';
import { extractDataGovCatalogMetadata, extractPdlDiscoveryMetadata } from '../src/lib/ingestion/source-metadata';

const OUTPUT_PATH = 'artifacts/source-discovery/latest.json';
const USER_AGENT = 'BharatZero source discovery audit';
const FETCH_TIMEOUT_MS = 45_000;
const INSPECTION_CONCURRENCY = 4;

function hasFlag(name: string) {
	return process.argv.includes(name);
}

function textIncludes(text: string, pattern: string) {
	return text.toLowerCase().includes(pattern.toLowerCase());
}

function extractSignals(target: SourceDiscoveryTarget, html: string) {
	const $ = cheerio.load(html);
	const pageText = $('body').text().replace(/\s+/g, ' ').trim();
	const linkText = $('a')
		.toArray()
		.map((element) => $(element).text().trim())
		.filter(Boolean)
		.join(' | ');
	const combined = `${pageText} ${linkText}`;
	const signals: string[] = [];

	for (const signal of ['Catalog API', 'Data API', 'Zip Download', 'Download', 'Reference URL', 'Questions', 'Debates', 'Committee', 'Bills']) {
		if (textIncludes(combined, signal)) signals.push(signal);
	}

	if (target.url.includes('sansad.in')) signals.push('Sansad URL');
	if (target.url.includes('data.gov.in')) signals.push('data.gov.in URL');
	if (target.url.includes('eparlib.sansad.in')) signals.push('Parliament Digital Library URL');

	return Array.from(new Set(signals));
}

function discoveryUrlsFor(target: SourceDiscoveryTarget) {
	return [target.url, ...(target.fallbackUrls ?? [])];
}

async function fetchHtml(url: string) {
	const response = await fetchResponse(url, { headers: { accept: 'text/html,application/xhtml+xml', 'accept-language': 'en-IN,en;q=0.9', 'user-agent': USER_AGENT } });
	return { response, html: await response.text() };
}

async function inspectTarget(target: SourceDiscoveryTarget): Promise<SourceDiscoveryResult> {
	const errors: string[] = [];

	for (const url of discoveryUrlsFor(target)) {
		try {
			const { response, html } = await fetchHtml(url);
			const $ = cheerio.load(html);
			const title = $('title').first().text().replace(/\s+/g, ' ').trim() || null;

			if (response.ok) {
				const finalUrl = response.url;
				const metadata: SourceDiscoveryResult['metadata'] = {};
				const dataGovCatalog = extractDataGovCatalogMetadata(html, finalUrl);
				if (dataGovCatalog) metadata.dataGovCatalog = dataGovCatalog;
				if (finalUrl.includes('eparlib.sansad.in')) metadata.pdl = extractPdlDiscoveryMetadata(html, finalUrl);

				return {
					...target,
					ok: true,
					status: response.status,
					finalUrl,
					title,
					signals: extractSignals({ ...target, url }, html),
					...(Object.keys(metadata).length > 0 ? { metadata } : {})
				};
			}

			errors.push(`${url}: HTTP ${response.status}`);
		} catch (error) {
			errors.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	return {
		...target,
		ok: false,
		status: null,
		finalUrl: null,
		title: null,
		signals: [],
		error: errors.join(' | ')
	}
}

export async function inspectTargets(targets: SourceDiscoveryTarget[]) {
	const results: SourceDiscoveryResult[] = [];
	let nextIndex = 0;

	async function worker() {
		while (nextIndex < targets.length) {
			const index = nextIndex;
			nextIndex += 1;
			results[index] = await inspectTarget(targets[index]);
		}
	}

	await Promise.all(Array.from({ length: Math.min(INSPECTION_CONCURRENCY, targets.length) }, worker));
	return results;
}

async function main() {
	const results = await inspectTargets(sourceDiscoveryTargets);
	const payload = {
		generatedAt: new Date().toISOString(),
		targetCount: sourceDiscoveryTargets.length,
		summary: summarizeDiscoveryTargets(),
		results
	};

	if (hasFlag('--write')) {
		const outputPath = resolve(process.cwd(), OUTPUT_PATH);
		await mkdir(dirname(outputPath), { recursive: true });
		await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
		console.log(`Wrote ${OUTPUT_PATH}`);
	}

	console.log(JSON.stringify(payload, null, 2));
}

runCli(import.meta.url, main);
