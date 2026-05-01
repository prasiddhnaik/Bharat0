import * as cheerio from 'cheerio';

export type DataGovCatalogMetadata = {
	nid: string | null;
	uuid: string | null;
	nodeAlias: string | null;
	groupName: string | null;
	updatedDate: string | null;
	keywords: string[];
	apiPath: string | null;
	apiUrl: string | null;
	catalogApiAvailable: boolean;
	zipDownloadAvailable: boolean;
};

export type PdlDiscoveryMetadata = {
	resultCount: number | null;
	sampleHandles: string[];
	sampleBitstreams: string[];
	sampleTitles: string[];
	facetValues: Record<string, string[]>;
};

function cleanValue(value: string | null) {
	if (!value) return null;
	return value
		.replace(/\\u002F/g, '/')
		.replace(/\\\//g, '/')
		.replace(/\\"/g, '"')
		.replace(/&amp;/g, '&')
		.replace(/\s+/g, ' ')
		.trim();
}

function extractNuxtString(html: string, key: string) {
	const pattern = new RegExp(`${key}:"((?:\\\\.|[^"\\\\])*)"`);
	return cleanValue(pattern.exec(html)?.[1] ?? null);
}

function unique(values: string[]) {
	return Array.from(new Set(values.filter(Boolean)));
}

function absoluteUrl(href: string, pageUrl: string) {
	return new URL(href, pageUrl).toString();
}

export function extractDataGovCatalogMetadata(html: string, pageUrl: string): DataGovCatalogMetadata | null {
	if (!pageUrl.includes('data.gov.in')) return null;

	const $ = cheerio.load(html);
	const pageText = $('body').text().replace(/\s+/g, ' ').trim();
	const uuid = extractNuxtString(html, 'uuid');
	const apiPath = uuid ? `/apis/${uuid}` : null;
	const keywords = (extractNuxtString(html, 'field_keywords') ?? $('meta[name="keywords"]').attr('content') ?? '')
		.split(/,|\|\|/)
		.map((keyword) => keyword.trim())
		.filter(Boolean);

	return {
		nid: extractNuxtString(html, 'nid'),
		uuid,
		nodeAlias: extractNuxtString(html, 'node_alias'),
		groupName: extractNuxtString(html, 'field_group_name'),
		updatedDate: extractNuxtString(html, 'updated_date'),
		keywords: unique(keywords),
		apiPath,
		apiUrl: apiPath ? absoluteUrl(apiPath, pageUrl) : null,
		catalogApiAvailable: !/Catalog API is not available/i.test(pageText),
		zipDownloadAvailable: /Zip Download/i.test(pageText)
	};
}

export function extractPdlDiscoveryMetadata(html: string, pageUrl: string): PdlDiscoveryMetadata {
	const $ = cheerio.load(html);
	const pageText = $('body').text().replace(/\s+/g, ' ').trim();
	const resultCount = Number(/Results\s+[\d,-]+\s+of\s+([\d,]+)/i.exec(pageText)?.[1]?.replace(/,/g, '')) || null;
	const handleSelector =
		$('.discovery-result-results').length > 0
			? '.discovery-result-results a[href*="/handle/123456789/"]'
			: 'a[href*="/handle/123456789/"]';
	const bitstreamSelector =
		$('.discovery-result-results').length > 0
			? '.discovery-result-results a[href*="/bitstream/123456789/"]'
			: 'a[href*="/bitstream/123456789/"]';
	const sampleHandles = unique(
		$(handleSelector)
			.toArray()
			.map((element) => $(element).attr('href'))
			.filter((href): href is string => Boolean(href))
			.filter((href) => /\/handle\/123456789\/\d+/.test(href))
			.map((href) => absoluteUrl(href, pageUrl))
	).slice(0, 10);
	const sampleBitstreams = unique(
		$(bitstreamSelector)
			.toArray()
			.map((element) => $(element).attr('href'))
			.filter((href): href is string => Boolean(href))
			.map((href) => absoluteUrl(href, pageUrl))
	).slice(0, 10);
	const sampleTitles = unique(
		$('.title-field')
			.toArray()
			.map((element) => $(element).text().replace(/\s+/g, ' ').trim())
	).slice(0, 10);
	const facetValues: Record<string, string[]> = {};

	for (const element of $('a[href*="filtername="]').toArray()) {
		const href = $(element).attr('href');
		if (!href) continue;

		const parsed = new URL(absoluteUrl(href, pageUrl));
		const facetName = parsed.searchParams.get('filtername');
		const facetValue = parsed.searchParams.get('filterquery');
		if (!facetName || !facetValue) continue;

		facetValues[facetName] = unique([...(facetValues[facetName] ?? []), facetValue]);
	}

	return {
		resultCount,
		sampleHandles,
		sampleBitstreams,
		sampleTitles,
		facetValues
	};
}
