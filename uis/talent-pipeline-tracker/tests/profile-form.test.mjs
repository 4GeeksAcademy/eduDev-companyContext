import assert from 'node:assert/strict';
import test from 'node:test';
import { profileValues, profilePayload } from '../lib/profile-form.ts';

test('nullable profile fields become empty controlled inputs without identity', () => {
  assert.deepEqual(profileValues({ id: 'p', user_id: 'u', name: null, phone: null, address: null }),
    { name: '', phone: '', address: '' });
});

test('profile payload trims contacts and excludes identity fields', () => {
  assert.deepEqual(profilePayload({ name: ' Ana ', phone: ' +34 600-123 ', address: ' Calle Uno, 2 ',
    email: 'ignored@example.test', id: 'p', user_id: 'u', role: 'admin' }),
  { name: 'Ana', phone: '+34 600-123', address: 'Calle Uno, 2' });
});

test('blank inputs explicitly clear all profile fields', () => {
  assert.deepEqual(profilePayload({ name: ' ', phone: '', address: '\t\n' }),
    { name: null, phone: null, address: null });
});

test('provided contact strings survive loading and round trip unchanged', () => {
  const contacts = { name: 'María José', phone: '+34 (600) 123-456 ext. 2', address: 'Piso 2\nPuerta B' };
  const values = profileValues({ ...contacts, id: 'p', user_id: 'u' });
  assert.deepEqual(values, contacts);
  assert.deepEqual(profilePayload(values), contacts);
});
