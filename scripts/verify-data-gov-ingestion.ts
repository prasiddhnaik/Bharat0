import assert from 'node:assert/strict';
import {
	dataGovDebates,
	dataGovMeta,
	dataGovQuestions,
	dataGovTimelineEvents
} from '../src/lib/data/generated/data-gov-questions';
import { getDashboardData } from '../src/lib/data/view-model';
import { officialSourceAdapters } from '../src/lib/ingestion/source-adapters';

assert.ok(dataGovQuestions.length >= 16, 'OGD question catalogs should be generated from source discovery');
assert.ok(dataGovDebates.length >= 2, 'OGD debate catalogs should be generated from source discovery');
assert.equal(dataGovTimelineEvents.length, dataGovQuestions.length + dataGovDebates.length);
assert.equal(dataGovMeta.questionCatalogs, dataGovQuestions.length);
assert.ok(
	dataGovQuestions.every((question) => question.source_url.includes('data.gov.in') && question.isDemoSeed === false),
	'OGD question rows must link back to data.gov.in and be marked official/non-demo'
);

const dataGovAdapter = officialSourceAdapters.find((adapter) => adapter.id === 'data-gov');
assert.equal(dataGovAdapter?.status, 'using-now');
assert.ok(dataGovAdapter?.outputs.includes('questions'));
assert.ok(dataGovAdapter?.outputs.includes('debates'));

const questionDashboard = getDashboardData({
	section: 'questions',
	language: 'en',
	query: '',
	house: 'rajya-sabha',
	status: 'all',
	area: 'all',
	source: 'source-data-gov',
	primeMinister: 'all',
	date: '2026-04-25',
	page: 1,
	pageSize: 60
});

assert.equal(questionDashboard.questions.length, dataGovQuestions.length);
assert.equal(questionDashboard.pagination.totalItems, dataGovQuestions.length);

console.log(`OGD ingestion checks passed: ${dataGovQuestions.length} question catalogs, ${dataGovDebates.length} debate catalogs.`);
