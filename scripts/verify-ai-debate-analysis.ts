import assert from 'node:assert/strict';
import type { Debate } from '../src/lib/domain/types';
import {
	buildDebateTranscriptCoverage,
	getDebateAnalysisInputHash,
	type DebateTranscriptInput
} from '../src/lib/server/ai/gemma-debate-analysis';
import { reportOptionalEnv } from './lib/envCheck';
import { makeLogger } from './lib/logger';

const log = makeLogger('VERIFY-AI-DEBATE');
reportOptionalEnv(['GEMMA_API_KEY', 'GEMINI_API_KEY'], log);

const baseDebate: Debate = {
	id: 'test-debate',
	house: 'lok-sabha',
	date: '2025-08-07',
	title: 'Discussion on the Test Bill, 2025',
	summary: 'Curated summary of a Lok Sabha debate on a finance amendment.',
	source_url: 'https://sansad.in/test-debate',
	transcript_url: 'https://sansad.in/test-debate.pdf',
	members: ['Member A', 'Member B', 'Member C'],
	debate_type: 'Bill',
	related_bill_id: 'test-bill-2025',
	isDemoSeed: false
};

// 1. Coverage strategy: full when text within budget
const shortText = 'Short transcript text.';
const shortTranscript: DebateTranscriptInput = {
	status: 'extracted',
	text: shortText,
	textHash: 'hash-short',
	charCount: shortText.length
};
const shortCoverage = buildDebateTranscriptCoverage(shortTranscript);
assert.equal(shortCoverage.coverage.strategy, 'full');
assert.equal(shortCoverage.coverage.totalChars, shortText.length);
assert.equal(shortCoverage.coverage.includedChars, shortText.length);
assert.equal(shortCoverage.coverage.omittedChars, 0);
assert.equal(shortCoverage.excerpt, shortText);

// 2. Coverage strategy: head-tail-truncated when text exceeds budget
const oversizedLength = 200_000;
const oversizedText = 'A'.repeat(50_000) + 'B'.repeat(100_000) + 'C'.repeat(50_000);
assert.equal(oversizedText.length, oversizedLength);
const oversizedTranscript: DebateTranscriptInput = {
	status: 'extracted',
	text: oversizedText,
	textHash: 'hash-long',
	charCount: oversizedText.length
};
const oversizedCoverage = buildDebateTranscriptCoverage(oversizedTranscript);
assert.equal(oversizedCoverage.coverage.strategy, 'head-tail-truncated');
assert.equal(oversizedCoverage.coverage.totalChars, oversizedLength);
assert.equal(oversizedCoverage.coverage.headChars, 80_000);
assert.equal(oversizedCoverage.coverage.tailChars, 40_000);
assert.equal(oversizedCoverage.coverage.includedChars, 120_000);
assert.equal(oversizedCoverage.coverage.omittedChars, oversizedLength - 120_000);
assert.match(oversizedCoverage.excerpt, /TRANSCRIPT TRUNCATED/);
// Head is all 'A' — first character is 'A'.
assert.equal(oversizedCoverage.excerpt.slice(0, 1), 'A');
// Tail is all 'C' — last character is 'C'.
assert.equal(oversizedCoverage.excerpt.slice(-1), 'C');

// 3. Coverage strategy: metadata-only when transcript is null or status is metadata_only
const metadataOnlyCoverage = buildDebateTranscriptCoverage(null);
assert.equal(metadataOnlyCoverage.coverage.strategy, 'metadata-only');
assert.equal(metadataOnlyCoverage.excerpt, '');
assert.equal(metadataOnlyCoverage.coverage.includedChars, 0);

const metadataOnlyExplicit = buildDebateTranscriptCoverage({ status: 'metadata_only', text: '', textHash: null, charCount: 0 });
assert.equal(metadataOnlyExplicit.coverage.strategy, 'metadata-only');
assert.equal(metadataOnlyExplicit.coverage.transcriptStatus, 'metadata_only');

// 4. Coverage strategy: transcript-failed
const failedCoverage = buildDebateTranscriptCoverage({ status: 'failed', text: '', textHash: null, charCount: 0 });
assert.equal(failedCoverage.coverage.strategy, 'transcript-failed');
assert.equal(failedCoverage.excerpt, '');

// 5. Input hash determinism: identical inputs → identical hashes
const hashA = getDebateAnalysisInputHash(baseDebate, shortCoverage.coverage, 'en');
const hashB = getDebateAnalysisInputHash(baseDebate, shortCoverage.coverage, 'en');
assert.equal(hashA, hashB);

// 6. Input hash sensitivity: language flip changes hash
const hashEn = getDebateAnalysisInputHash(baseDebate, shortCoverage.coverage, 'en');
const hashHi = getDebateAnalysisInputHash(baseDebate, shortCoverage.coverage, 'hi');
assert.notEqual(hashEn, hashHi);

// 7. Input hash sensitivity: coverage strategy change changes hash
const hashFull = getDebateAnalysisInputHash(baseDebate, shortCoverage.coverage, 'en');
const hashTruncated = getDebateAnalysisInputHash(baseDebate, oversizedCoverage.coverage, 'en');
assert.notEqual(hashFull, hashTruncated);

// 8. Input hash sensitivity: debate metadata change changes hash
const renamedDebate: Debate = { ...baseDebate, title: 'Renamed Discussion on the Test Bill, 2025' };
const hashOriginal = getDebateAnalysisInputHash(baseDebate, shortCoverage.coverage, 'en');
const hashRenamed = getDebateAnalysisInputHash(renamedDebate, shortCoverage.coverage, 'en');
assert.notEqual(hashOriginal, hashRenamed);

// 9. Input hash sensitivity: transcript text hash change changes hash via coverage
const coverageA = buildDebateTranscriptCoverage({ status: 'extracted', text: 'same', textHash: 'hash-A', charCount: 4 }).coverage;
const coverageB = buildDebateTranscriptCoverage({ status: 'extracted', text: 'same', textHash: 'hash-B', charCount: 4 }).coverage;
assert.notEqual(getDebateAnalysisInputHash(baseDebate, coverageA, 'en'), getDebateAnalysisInputHash(baseDebate, coverageB, 'en'));

// 10. Coverage of metadata-only path through hash: same metadata + same status → same hash
const noTranscriptA = buildDebateTranscriptCoverage(null).coverage;
const noTranscriptB = buildDebateTranscriptCoverage(null).coverage;
assert.equal(getDebateAnalysisInputHash(baseDebate, noTranscriptA, 'en'), getDebateAnalysisInputHash(baseDebate, noTranscriptB, 'en'));

log.info('AI debate analysis checks passed.');
