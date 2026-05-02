import assert from 'node:assert/strict';
import { formatEconomicImpactForPanel, getEconomicImpactProfile } from '../src/lib/domain/economic-impact';
import type { Bill } from '../src/lib/domain/types';
import { getFallbackGdpImpact } from '../src/lib/server/ai/groq-bill-analysis';
import { reportOptionalEnv } from './lib/envCheck';
import { makeLogger } from './lib/logger';

const log = makeLogger('VERIFY-AI');
reportOptionalEnv(['GROQ_API_KEY', 'NVIDIA_API_KEY'], log);

const baseBill: Bill = {
	id: 'test-bill',
	title_en: 'Test Bill, 2025',
	title_hi: 'परीक्षण विधेयक, 2025',
	bill_number: 'Bill No. 1 of 2025',
	bill_year: 2025,
	bill_type: 'ordinary',
	origin_house: 'lok-sabha',
	current_stage: 'introduced',
	ministry: 'Ministry of Finance',
	introduced_on: '2025-07-18',
	latest_action_date: '2025-07-20',
	source_url: 'https://sansad.in/test-bill',
	summary: 'A bill concerning tax administration and budget implementation.',
	isDemoSeed: false
};

const financeProfile = getEconomicImpactProfile(baseBill, '2026-05-02');
const financeImpact = formatEconomicImpactForPanel(baseBill, '2026-05-02');

assert.equal(financeProfile.category, 'Fiscal, tax, and budget');
assert.equal(financeProfile.confidence, 'medium');
assert.match(financeImpact, /Near-term qualitative read/);
assert.match(financeImpact, /Transmission:/);
assert.match(financeImpact, /tax liability/);
assert.match(financeImpact, /Confidence: medium/);
assert.match(financeImpact, /Verify with: Budget documents/);
assert.equal(getFallbackGdpImpact(baseBill), formatEconomicImpactForPanel(baseBill));

const oldLapsedBill: Bill = {
	...baseBill,
	id: 'old-lapsed-environment-bill',
	title_en: 'Environment Protection Amendment Bill, 2005',
	bill_year: 2005,
	current_stage: 'lapsed',
	ministry: 'Ministry of Environment, Forest and Climate Change',
	introduced_on: '2005-03-10',
	latest_action_date: '2006-02-01',
	summary: 'Environment compliance bill.'
};
const oldImpact = formatEconomicImpactForPanel(oldLapsedBill, '2026-05-02');
assert.match(oldImpact, /Long-run or retrospective read/);
assert.match(oldImpact, /unrealised/);
assert.match(oldImpact, /environmental compliance/);

const metadataOnlyBill: Bill = {
	...baseBill,
	id: 'metadata-only-digital-bill',
	title_en: 'Digital Services Regulation Bill, 2026',
	ministry: 'Ministry of Electronics and Information Technology',
	summary: 'Digital Services Regulation Bill, 2026 is a ordinary bill from Ministry of Electronics and Information Technology with status introduced in the Sansad legislation dataset.'
};
const metadataProfile = getEconomicImpactProfile(metadataOnlyBill, '2026-05-02');
assert.equal(metadataProfile.category, 'Digital, data, and communications');
assert.equal(metadataProfile.confidence, 'low');

const publishedDigitalBill: Bill = {
	...metadataOnlyBill,
	current_stage: 'act_published',
	summary: 'A bill concerning digital services, platform compliance, and user safeguards.'
};
const publishedDigitalImpact = formatEconomicImpactForPanel(publishedDigitalBill, '2026-05-02');
assert.match(publishedDigitalImpact, /Implementation read/);
assert.doesNotMatch(publishedDigitalImpact, /Near-term qualitative read/);

log.info('AI bill analysis checks passed.');
