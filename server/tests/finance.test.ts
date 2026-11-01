import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../auth.js';
import { predictCategory, forecastSpending, checkTransactionAnomaly } from '../ml.js';
import { initDatabase, db } from '../db.js';

test('auth: password hashing and verification', () => {
  const password = 'SuperSecretFintechPassword123!';
  const { hash, salt } = hashPassword(password);
  assert.ok(hash && salt, 'Hash and salt should be generated');

  const isValid = verifyPassword(password, hash, salt);
  assert.equal(isValid, true, 'Original password should verify correctly');

  const isInvalid = verifyPassword('WrongPassword', hash, salt);
  assert.equal(isInvalid, false, 'Incorrect password should fail verification');
});

test('auth: JWT token signing and payload extraction', () => {
  const dummyUser = { id: 'u_test_123', email: 'tester@finsight.ai', full_name: 'Test Engineer' };
  const token = generateToken(dummyUser);
  assert.ok(token && token.split('.').length === 3, 'Token should be valid HS256 JWT format');

  const payload = verifyToken(token);
  assert.equal(payload.sub, 'u_test_123');
  assert.equal(payload.email, 'tester@finsight.ai');
});

test('ml: automated category classification', () => {
  initDatabase();
  // Starbucks should classify as Food & Dining
  const coffeePred = predictCategory(null, 'Starbucks Coffee Latte', 'Starbucks', 'Morning cappuccino');
  assert.equal(coffeePred.categoryId, 'cat_food');
  assert.ok(coffeePred.confidence > 0.6, 'Confidence should be high for prominent merchant');

  // Uber ride should classify as Transportation
  const uberPred = predictCategory(null, 'Uber Ride Downtown', 'Uber', 'Cab to airport');
  assert.equal(uberPred.categoryId, 'cat_transport');

  // Netflix should classify as Subscriptions
  const netflixPred = predictCategory(null, 'Netflix Subscription Renewal', 'Netflix', 'Monthly streaming');
  assert.equal(netflixPred.categoryId, 'cat_subscriptions');
});

test('ml: statistical anomaly detection identifies large outliers', () => {
  initDatabase();
  const testUserId = 'test_user_anomaly_check';

  // Check that extreme single numbers trigger warnings
  const extremeAnomaly = checkTransactionAnomaly(testUserId, 'cat_food', 150000);
  assert.equal(extremeAnomaly.isAnomaly, true, 'Huge single transaction should be flagged as anomaly');
});
