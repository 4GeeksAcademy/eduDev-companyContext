import { passwordError, resetSucceeded, resetToken, validatePasswordForm } from '../lib/password-form';

const values = { email: ' test@example.invalid ', current_password: 'old', new_password: 'é'.repeat(36), confirmation: 'é'.repeat(36) };

test('forgot validates email only and ignores password fields', () => {
  expect(validatePasswordForm('forgot', { ...values, current_password: '', new_password: '', confirmation: '' })).toEqual({});
  for (const email of ['', ' ', 'invalid', 'bad@address']) {
    expect(validatePasswordForm('forgot', { ...values, email })).toEqual({ email: ['Introduce un correo electrónico válido.'] });
  }
});

test.each(['reset', 'change'] as const)('%s accepts matching 1/72-byte passwords', mode => {
  for (const password of [' ', 'a', 'é'.repeat(36)]) {
    expect(validatePasswordForm(mode, { ...values, current_password: password, new_password: password, confirmation: password })).toEqual({});
  }
});

test.each(['reset', 'change'] as const)('%s rejects required, oversized and mismatched new passwords', mode => {
  expect(validatePasswordForm(mode, { ...values, new_password: '', confirmation: '' })).toEqual({
    new_password: ['La contraseña es obligatoria.'], confirmation: ['Las contraseñas deben coincidir.'],
  });
  const oversized = 'é'.repeat(36) + 'a';
  expect(validatePasswordForm(mode, { ...values, new_password: oversized, confirmation: oversized })).toEqual({
    new_password: ['La contraseña no puede superar 72 bytes UTF-8.'],
  });
  expect(validatePasswordForm(mode, { ...values, confirmation: 'different' })).toEqual({
    confirmation: ['Las contraseñas deben coincidir.'],
  });
});

test('current password required/byte checks apply only to change', () => {
  for (const current_password of ['', 'é'.repeat(36) + 'a']) {
    expect(validatePasswordForm('change', { ...values, current_password })).toHaveProperty('current_password');
    expect(validatePasswordForm('reset', { ...values, current_password })).toEqual({});
  }
});

test('reset token preserves a single nonblank value but rejects missing/blank/duplicates', () => {
  expect(resetToken(new URLSearchParams({ token: ' signed-link ' }))).toBe(' signed-link ');
  for (const query of ['', 'token=', 'token=+', 'token=one&token=two', 'token=one&token=one']) {
    expect(resetToken(new URLSearchParams(query))).toBeNull();
  }
});

test('reset success requires exactly one exact success value', () => {
  expect(resetSucceeded(new URLSearchParams('reset=success'))).toBe(true);
  for (const query of ['', 'reset=', 'reset=Success', 'reset=success+', 'reset=success&reset=success']) {
    expect(resetSucceeded(new URLSearchParams(query))).toBe(false);
  }
});

test('password guidance maps only known mode/status decisions to fixed safe copy', () => {
  for (const status of [400, 401, 422]) {
    expect(passwordError('reset', status)).toBe('El enlace no es válido, ha caducado o ya se ha utilizado. Solicita uno nuevo.');
  }
  expect(passwordError('change', 400)).toBe('La contraseña actual es incorrecta.');
  for (const mode of ['forgot', 'reset', 'change'] as const) {
    expect(passwordError(mode, 500)).toBe('No se pudo completar la solicitud. Inténtalo de nuevo.');
  }
  expect(passwordError('forgot', 400)).toBe(passwordError('change', 401));
});
