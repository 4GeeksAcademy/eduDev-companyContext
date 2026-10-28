import { authPayload, validateAuth } from '../lib/auth-form';

test('valid email and 1/72 UTF-8 byte passwords pass without trimming password', () => {
  for (const password of [' ', 'a', 'é'.repeat(36)]) {
    expect(validateAuth({ email: ' test@example.invalid ', password })).toEqual({});
  }
});

test('missing and invalid emails and empty/73-byte passwords fail their fields', () => {
  expect(validateAuth({ email: ' ', password: '' })).toEqual({
    email: ['El correo electrónico es obligatorio.'], password: ['La contraseña es obligatoria.'],
  });
  expect(validateAuth({ email: 'bad@address', password: 'é'.repeat(36) + 'a' })).toEqual({
    email: ['Introduce un correo electrónico válido.'],
    password: ['La contraseña no puede superar 72 bytes UTF-8.'],
  });
});

test('registration payload trims contacts, omits blanks and preserves password', () => {
  const values = { email: ' test@example.invalid ', password: ' secret ', name: ' Name ', phone: ' 00123 ', address: ' ' };
  expect(authPayload(values, true)).toEqual({
    email: 'test@example.invalid', password: ' secret ', name: 'Name', phone: '00123',
  });
  expect(values.address).toBe(' ');
});

test('login payload excludes all contacts and registration tolerates absent contacts', () => {
  const values = { email: ' test@example.invalid ', password: ' secret ' };
  expect(authPayload({ ...values, name: 'Name', phone: '123', address: 'Address' }, false))
    .toEqual({ email: 'test@example.invalid', password: ' secret ' });
  expect(authPayload(values, true)).toEqual({ email: 'test@example.invalid', password: ' secret ' });
});
