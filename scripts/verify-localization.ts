import assert from 'node:assert/strict';
import { bills } from '../src/lib/data/seed';
import { getBillTitle, parseLanguage, t } from '../src/lib/domain/localization';

assert.equal(parseLanguage('hi'), 'hi');
assert.equal(parseLanguage('en'), 'en');
assert.equal(parseLanguage('mr'), 'en');

const incomeTaxBill = bills.find((bill) => bill.id === 'income-tax-bill-2025');
assert.ok(incomeTaxBill, 'expected Income-Tax Bill fixture from official records');

assert.equal(getBillTitle(incomeTaxBill, 'en'), 'Income-Tax Bill, 2025');
assert.equal(getBillTitle(incomeTaxBill, 'hi'), 'आयकर विधेयक, 2025');
assert.equal(t('section.bills', 'hi'), 'विधेयक');
assert.equal(t('app.demoSeedOnly', 'en'), 'Official public records');
assert.equal(t('missing.key', 'hi'), 'missing.key');

console.log('Localization contract checks passed.');
