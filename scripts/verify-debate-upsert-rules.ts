import assert from 'node:assert/strict';
import {
	buildTranscriptMetadataUpdate,
	shouldMarkTranscriptStale,
	type DebateTranscriptMetadata,
	type ExistingDebateTranscript
} from './lib/debateUpsert';

const extractedTranscript: ExistingDebateTranscript = {
	status: 'EXTRACTED',
	extracted_from_url: 'https://eparlib.sansad.in/bitstream/123456789/2991119/1/2667.pdf',
	text: 'Extracted body text',
	text_hash: 'abc123',
	char_count: 19,
	error: 'previous non-fatal warning',
	extracted_at: new Date('2026-05-01T00:00:00.000Z')
};

const changedMetadata: DebateTranscriptMetadata = {
	source_url: 'https://eparlib.sansad.in/bitstream/123456789/2991119/1/changed.pdf',
	resolved_url: null,
	content_type: 'application/pdf',
	byte_length: 1_258_291
};

const changedUpdate = buildTranscriptMetadataUpdate(extractedTranscript, changedMetadata);
assert.equal(shouldMarkTranscriptStale(extractedTranscript, changedMetadata), true);
assert.equal(changedUpdate.status, 'STALE');
assert.equal(Object.hasOwn(changedUpdate, 'text'), false);
assert.equal(Object.hasOwn(changedUpdate, 'text_hash'), false);
assert.equal(Object.hasOwn(changedUpdate, 'char_count'), false);
assert.equal(Object.hasOwn(changedUpdate, 'error'), false);
assert.equal(Object.hasOwn(changedUpdate, 'extracted_at'), false);
assert.equal(Object.hasOwn(changedUpdate, 'extracted_from_url'), false);

const sameMetadata: DebateTranscriptMetadata = {
	source_url: 'https://eparlib.sansad.in/handle/123456789/2991119?view_type=search',
	resolved_url: 'https://eparlib.sansad.in/bitstream/123456789/2991119/1/2667.pdf',
	content_type: 'application/pdf',
	byte_length: 1_258_291
};
const sameUpdate = buildTranscriptMetadataUpdate(extractedTranscript, sameMetadata);
assert.equal(shouldMarkTranscriptStale(extractedTranscript, sameMetadata), false);
assert.equal(Object.hasOwn(sameUpdate, 'status'), false, 'same effective URL must not mark extracted transcript stale');

const metadataOnlyTranscript: ExistingDebateTranscript = {
	...extractedTranscript,
	status: 'METADATA_ONLY',
	extracted_from_url: null
};
const metadataOnlyUpdate = buildTranscriptMetadataUpdate(metadataOnlyTranscript, changedMetadata);
assert.equal(shouldMarkTranscriptStale(metadataOnlyTranscript, changedMetadata), false);
assert.equal(Object.hasOwn(metadataOnlyUpdate, 'status'), false, 'metadata-only rows should keep status on URL change');

const failedTranscript: ExistingDebateTranscript = {
	...extractedTranscript,
	status: 'FAILED'
};
const failedUpdate = buildTranscriptMetadataUpdate(failedTranscript, changedMetadata);
assert.equal(shouldMarkTranscriptStale(failedTranscript, changedMetadata), false);
assert.equal(Object.hasOwn(failedUpdate, 'status'), false, 'failed rows should keep status on URL change');

console.log('Debate upsert rule checks passed.');
