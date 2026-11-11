import assert from 'node:assert/strict';
import { test } from 'node:test';
import { latestQuestionSessions, normalizeRajyaSabhaQuestion, uniqueQuestions } from '../src/lib/ingestion/rajya-sabha-questions';

const row = { qslno: 328639, ses_no: 271, qno: 3018, qtitle: 'Tourism promotion', min_name: 'TOURISM ', adate: '2026-08-13T00:00:00', status: 'Answered  ', files: 'https://sansad.in/getFile/annex/271/AU3018.pdf?source=pqars' };
test('new question sessions are discovered rather than hardcoded', () => {
	assert.deepEqual(latestQuestionSessions([{ ssn_no: 270 }, { ssn_no: 272 }, { ssn_no: 271 }]), [272, 271]);
	assert.throws(() => latestQuestionSessions([]), /session/i);
});
test('question IDs, official answer dates and answer links remain stable', () => {
	const question = normalizeRajyaSabhaQuestion(row);
	assert.equal(question.id, 'rs-question-271-328639');
	assert.equal(question.date, '2026-08-13');
	assert.equal(question.answer_status, 'answered');
	assert.equal(question.ministry, 'TOURISM');
	assert.equal(question.source_url, row.files);
	assert.equal(uniqueQuestions([row, row]).length, 1);
	assert.throws(() => uniqueQuestions([row, { ...row, qtitle: 'Conflicting identity' }]), /conflict/i);
});
test('invalid dates and foreign answer links cannot enter the database', () => {
	assert.throws(() => normalizeRajyaSabhaQuestion({ ...row, adate: '2026-02-30' }), /date/i);
	assert.throws(() => normalizeRajyaSabhaQuestion({ ...row, files: 'https://example.com/fake.pdf' }), /source/i);
});
