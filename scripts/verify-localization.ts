import assert from 'node:assert/strict';
import { bills } from '../src/lib/data/seed';
import { getBillTitle, parseLanguage, t } from '../src/lib/domain/localization';

assert.equal(parseLanguage('hi'), 'hi');
assert.equal(parseLanguage('en'), 'en');
assert.equal(parseLanguage('mr'), 'en');

const publicHealthBill = bills.find((bill) => bill.id === 'bz-bill-public-health-2026');
assert.ok(publicHealthBill, 'expected public health demo bill fixture');

assert.equal(getBillTitle(publicHealthBill, 'en'), 'Demo Public Health Preparedness Bill, 2026');
assert.equal(getBillTitle(publicHealthBill, 'hi'), 'डेमो लोक स्वास्थ्य तैयारी विधेयक, 2026');
assert.equal(t('section.bills', 'hi'), 'विधेयक');
assert.equal(t('app.demoSeedOnly', 'en'), 'Demo seed data only');
assert.equal(t('missing.key', 'hi'), 'missing.key');

console.log('Localization contract checks passed.');
