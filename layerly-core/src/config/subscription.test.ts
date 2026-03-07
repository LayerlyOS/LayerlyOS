import assert from 'node:assert';
import { describe, it } from 'node:test';
import { getPlanConfig, SUBSCRIPTION_PLANS } from './subscription';

describe('Subscription System', () => {
  describe('Plan Configuration', () => {
    it('HOBBY plan should have correct limits', () => {
      const plan = SUBSCRIPTION_PLANS.HOBBY;
      assert.strictEqual(plan.id, 'HOBBY');
      assert.strictEqual(plan.maxFilaments, 3);
      assert.strictEqual(plan.maxPrinters, 1);
      assert.strictEqual(plan.features.pdfExport, false);
      assert.strictEqual(plan.features.clientManagement, false);
      assert.strictEqual(plan.features.advancedAnalytics, false);
    });

    it('MAKER plan should have correct limits', () => {
      const plan = SUBSCRIPTION_PLANS.MAKER;
      assert.strictEqual(plan.id, 'MAKER');
      assert.strictEqual(plan.maxFilaments, -1); // Unlimited filaments
      assert.strictEqual(plan.maxPrinters, -1); // Unlimited printers
      assert.strictEqual(plan.features.pdfExport, true);
      assert.strictEqual(plan.features.clientManagement, true);
      assert.strictEqual(plan.features.advancedAnalytics, false);
    });

    it('FARM plan should have correct limits', () => {
      const plan = SUBSCRIPTION_PLANS.FARM;
      assert.strictEqual(plan.id, 'FARM');
      assert.strictEqual(plan.maxFilaments, -1); // Unlimited filaments
      assert.strictEqual(plan.maxPrinters, -1); // Unlimited printers
      assert.strictEqual(plan.features.pdfExport, true);
      assert.strictEqual(plan.features.clientManagement, true);
      assert.strictEqual(plan.features.advancedAnalytics, true);
    });
  });

  describe('getPlanConfig Resolution', () => {
    it('should return HOBBY for undefined input', () => {
      const config = getPlanConfig(undefined);
      assert.strictEqual(config.id, 'HOBBY');
    });

    it('should return HOBBY for null input', () => {
      const config = getPlanConfig(null);
      assert.strictEqual(config.id, 'HOBBY');
    });

    it('should return HOBBY for empty string', () => {
      const config = getPlanConfig('');
      assert.strictEqual(config.id, 'HOBBY');
    });

    it('should return HOBBY for invalid tier name', () => {
      const config = getPlanConfig('INVALID_TIER');
      assert.strictEqual(config.id, 'HOBBY');
    });

    it('should return correct plan for valid tier names (case insensitive)', () => {
      assert.strictEqual(getPlanConfig('MAKER').id, 'MAKER');
      assert.strictEqual(getPlanConfig('maker').id, 'MAKER');
      assert.strictEqual(getPlanConfig('FARM').id, 'FARM');
    });
  });
});
