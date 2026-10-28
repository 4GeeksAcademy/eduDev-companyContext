import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validatePasswordForm, resetToken, resetSucceeded, passwordError } from '../lib/password-form.ts';

test('password validation requires matching passwords and preserves bcrypt byte boundary', () => {
  const valid = { email: 'a@example.test', current_password: 'old', new_password: 'ñ'.repeat(36), confirmation: 'ñ'.repeat(36) };
  assert.deepEqual(validatePasswordForm('change', valid), {});
  assert.ok(validatePasswordForm('change', { ...valid, current_password: '' }).current_password);
  assert.ok(validatePasswordForm('reset', { ...valid, confirmation: 'other' }).confirmation);
  assert.ok(validatePasswordForm('reset', { ...valid, new_password: '' }).new_password);
  assert.ok(validatePasswordForm('reset', { ...valid, new_password: 'ñ'.repeat(37) }).new_password);
  assert.ok(validatePasswordForm('forgot', { ...valid, email: 'invalid' }).email);
  assert.deepEqual(validatePasswordForm('forgot', valid), {});
});

test('query and status helpers fail safely without echoing arbitrary text', () => {
  assert.equal(resetToken(new URLSearchParams('token=abc')), 'abc');
  for (const query of ['', 'token=', 'token=a&token=b', 'token=%20']) assert.equal(resetToken(new URLSearchParams(query)), null);
  assert.equal(resetSucceeded(new URLSearchParams('reset=success')), true);
  for (const query of ['', 'reset=secret', 'reset=success&reset=no']) assert.equal(resetSucceeded(new URLSearchParams(query)), false);
  assert.match(passwordError('reset', 400), /enlace/i);
  assert.match(passwordError('change', 400), /actual/i);
  assert.doesNotMatch(passwordError('change', 500), /actual/i);
});

test('guard public allowlist includes recovery but never authenticated password change (structural)', () => {
  const source = readFileSync(new URL('../components/SessionGuard.tsx', import.meta.url), 'utf8');
  const condition = source.match(/if \((.*?)\) \{/s)[1];
  for (const path of ['/login', '/register', '/forgot-password', '/reset-password']) assert.ok(condition.includes(`pathname === '${path}'`));
  assert.ok(!condition.includes('/account/change-password'));
});
