import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import * as cheerio from 'cheerio';
import {
	sourceDiscoveryTargets,
	summarizeDiscoveryTargets,
	type SourceDiscoveryResult,
	type SourceDiscoveryTarget
} from '../src/lib/ingestion/source-discovery';

const OUTPUT_PATH = 'artifacts/source-discovery/latest.json';
const USER_AGENT = 'BharatZero source discovery audit';

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

async function inspectTarget(target: SourceDiscoveryTarget): Promise<SourceDiscoveryResult> {
	try {
		const response = await fetch(target.url, {
			headers: {
				accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'accept-language': 'en-IN,en;q=0.9',
				'user-agent': USER_AGENT
			},
			redirect: 'follow'
		});
		const html = await response.text();
		const $ = cheerio.load(html);
		const title = $('title').first().text().replace(/\s+/g, ' ').trim() || null;

		return {
			...target,
			ok: response.ok,
			status: response.status,
			finalUrl: response.url,
			title,
			signals: response.ok ? extractSignals(target, html) : []
		};
	} catch (error) {
		return {
			...target,
			ok: false,
			status: null,
			finalUrl: null,
			title: null,
			signals: [],
			error: error instanceof Error ? error.message : String(error)
		};
	}
}

async function main() {
	const results = await Promise.all(sourceDiscoveryTargets.map(inspectTarget));
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

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
