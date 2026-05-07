import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

type DiscoveryPayload = {
	generatedAt: string;
	results: Array<{
		id: string;
		name: string;
		finalUrl: string | null;
		title: string | null;
		outputs: string[];
		metadata?: {
			dataGovCatalog?: {
				groupName: string | null;
				updatedDate: string | null;
				apiUrl: string | null;
				catalogApiAvailable: boolean;
				zipDownloadAvailable: boolean;
			};
		};
	}>;
};

const INPUT_PATH = 'artifacts/source-discovery/latest.json';
const OUTPUT_PATH = 'src/lib/data/generated/data-gov-questions.ts';

function hasFlag(name: string) {
	return process.argv.includes(name);
}

function dateFromDataGov(value: string | null | undefined, fallback: string) {
	if (!value) return fallback.slice(0, 10);
	const [day, month, year] = value.split('/');
	if (!day || !month || !year) return fallback.slice(0, 10);
	return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function sessionFromId(id: string) {
	return /session-(\d+)/.exec(id)?.[1] ?? 'unknown';
}

function quote(value: unknown) {
	return JSON.stringify(value);
}

function sourceNote(catalog: NonNullable<DiscoveryPayload['results'][number]['metadata']>['dataGovCatalog'] | undefined) {
	const apiState = catalog?.catalogApiAvailable ? 'API available' : 'API unavailable';
	const zipState = catalog?.zipDownloadAvailable ? 'ZIP metadata advertised' : 'ZIP unavailable';
	return `${apiState}; ${zipState}`;
}

async function main() {
	const inputPath = resolve(process.cwd(), INPUT_PATH);
	const outputPath = resolve(process.cwd(), OUTPUT_PATH);
	const payload = JSON.parse(await readFile(inputPath, 'utf8')) as DiscoveryPayload;
	const fallbackDate = payload.generatedAt;
	const dataGovResults = payload.results.filter((result) => result.finalUrl?.includes('data.gov.in'));
	const questionCatalogs = dataGovResults.filter((result) => result.id.startsWith('data-gov-rs-questions-session-'));
	const debateCatalogs = dataGovResults.filter((result) => result.outputs.includes('debates'));

	const questionItems = questionCatalogs.map((result) => {
		const catalog = result.metadata?.dataGovCatalog;
		const session = sessionFromId(result.id);
		const date = dateFromDataGov(catalog?.updatedDate, fallbackDate);
		return {
			id: `${result.id}-catalog`,
			number: `Session ${session}`,
			house: 'rajya-sabha',
			date,
			ministry: 'Rajya Sabha Secretariat',
			subject: `Rajya Sabha question-answer annexures, Session ${session}`,
			answer_status: 'answered',
			source_url: result.finalUrl!,
			isDemoSeed: false
		};
	});

	const debateItems = debateCatalogs.map((result) => {
		const catalog = result.metadata?.dataGovCatalog;
		const date = dateFromDataGov(catalog?.updatedDate, fallbackDate);
		const isLokSabha = result.id.includes('ls-');
		return {
			id: `${result.id}-catalog`,
			house: isLokSabha ? 'lok-sabha' : 'rajya-sabha',
			date,
			title: result.title?.replace(' | Open Government Data (OGD) Platform India', '') ?? result.name,
			summary: `Open Government Data Platform India catalog for ${isLokSabha ? 'Lok Sabha' : 'Rajya Sabha'} verbatim debate feeds. Metadata status: ${sourceNote(catalog)}.`,
			source_url: result.finalUrl!,
			transcript_language: 'English',
			members: [],
			debate_type: 'Verbatim debates catalog',
			isDemoSeed: false
		};
	});

	const timelineItems = [
		...questionItems.map((question) => ({
			id: `${question.id}-timeline`,
			date: question.date,
			house: question.house,
			type: 'question_answered',
			title: question.subject,
			description: `Official Open Government Data Platform India catalog for ${question.subject}. ${sourceNote(questionCatalogs.find((result) => `${result.id}-catalog` === question.id)?.metadata?.dataGovCatalog)}.`,
			source_url: question.source_url,
			isDemoSeed: false
		})),
		...debateItems.map((debate) => ({
			id: `${debate.id}-timeline`,
			date: debate.date,
			house: debate.house,
			type: 'debate_published',
			title: debate.title,
			description: debate.summary,
			source_url: debate.source_url,
			isDemoSeed: false
		}))
	];

	const file = `import type { Debate, Question, TimelineEvent } from '$lib/domain/types';

export const dataGovMeta = {
\tasOf: ${quote(payload.generatedAt.slice(0, 10))},
\tquestionCatalogs: ${questionItems.length},
\tdebateCatalogs: ${debateItems.length},
\tnote: 'Generated from artifacts/source-discovery/latest.json using scripts/sync-data-gov-questions.ts.'
} as const;

export const dataGovQuestions: Question[] = ${JSON.stringify(questionItems, null, '\t')};

export const dataGovDebates: Debate[] = ${JSON.stringify(debateItems, null, '\t')};

export const dataGovTimelineEvents: TimelineEvent[] = ${JSON.stringify(timelineItems, null, '\t')};
`;

	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(outputPath, file);

	if (!hasFlag('--quiet')) {
		console.log(`Wrote ${OUTPUT_PATH}`);
		console.log(`Loaded ${questionItems.length} OGD question catalogs and ${debateItems.length} OGD debate catalogs.`);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
