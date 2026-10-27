import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAuth, authPayload } from '../lib/auth-form.ts';

test('required email and password, without invented strength rules', () => {
  assert.ok(validateAuth({ email: '', password: '' }).email);
  assert.ok(validateAuth({ email: 'invalid', password: 'x' }).email);
  assert.deepEqual(validateAuth({ email: ' user@example.com ', password: ' ' }), {});
});

test('password limit is UTF-8 bytes, inclusive at 72', () => {
  const values = { email: 'user@example.com', password: 'é'.repeat(36) };
  assert.deepEqual(validateAuth(values), {});
  assert.ok(validateAuth({ ...values, password: values.password + 'a' }).password);
  assert.deepEqual(validateAuth({ ...values, password: 'a'.repeat(72) }), {});
  assert.ok(validateAuth({ ...values, password: 'a'.repeat(73) }).password);
});

test('normalize contacts, omit blank optional fields, preserve password whitespace', () => {
  const values = { email: ' User@example.com ', password: ' secret ', name: ' Ana ', phone: '  ', address: ' Main St ' };
  assert.deepEqual(authPayload(values, true), {
    email: 'User@example.com', password: ' secret ', name: 'Ana', address: 'Main St',
  });
  assert.deepEqual(authPayload(values, false), { email: 'User@example.com', password: ' secret ' });
});
