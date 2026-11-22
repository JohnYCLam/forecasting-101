import test from 'node:test';
import assert from 'node:assert/strict';
import { closedAlarm, openedAlarm, inferValve, historicalMinutes, fitValveHistory, valveRisks } from '../src/valve-alarm.js';

test('valve alarm uses the continuous bridge or the average over one unknown opening', () => {
  assert.ok(Math.abs(closedAlarm - Math.exp(-5.5)) < 1e-12);
  // Reference from a refined time/pressure integration (512 by 384 panels).
  assert.ok(Math.abs(openedAlarm - 0.67216023) < 1e-6);
  assert.equal(inferValve(0).alarm, closedAlarm);
  assert.equal(inferValve(1).alarm, openedAlarm);
});

test('a missing log gives distinct probabilities for opening and crossing', () => {
  const usual = inferValve(0.001), rare = inferValve(0.000001);
  assert.ok(Math.abs(usual.opened - 0.99389938) < 1e-7);
  assert.ok(Math.abs(usual.alarm - 0.66808456) < 1e-6);
  assert.ok(Math.abs(rare.alarm - 0.09759939) < 1e-6);
});

test('known drops are removed before estimating noise and opening frequency', () => {
  const fit = fitValveHistory([{opened: true, change: -0.50}, {opened: false, change: -0.10}]);
  assert.equal(fit.openings, 1);
  assert.equal(fit.prior, 0.5);
  assert.ok(Math.abs(fit.sigma - 0.10) < 1e-12);
});

test('training with zero logged openings yields the continuous-only missing-log estimate', () => {
  const fit = fitValveHistory(historicalMinutes(1000, 0, 42));
  assert.equal(fit.openings, 0);
  const risks = valveRisks(fit.sigma);
  assert.equal(inferValve(fit.prior, risks).alarm, risks.closed);
  assert.notEqual(risks.closed, closedAlarm);
  assert.notEqual(risks.opened, openedAlarm);
});
