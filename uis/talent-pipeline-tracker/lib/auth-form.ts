export type AuthValues = { email: string; password: string; name?: string; phone?: string; address?: string };

export function validateAuth(values: AuthValues): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  if (!values.email.trim()) errors.email = ['El correo electrónico es obligatorio.'];
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = ['Introduce un correo electrónico válido.'];
  }
  const bytes = new TextEncoder().encode(values.password).length;
  if (!bytes) errors.password = ['La contraseña es obligatoria.'];
  else if (bytes > 72) errors.password = ['La contraseña no puede superar 72 bytes UTF-8.'];
  return errors;
}

export function authPayload(values: AuthValues, registration: boolean): AuthValues {
  const payload: AuthValues = { email: values.email.trim(), password: values.password };
  if (registration) {
    for (const field of ['name', 'phone', 'address'] as const) {
      const value = values[field]?.trim();
      if (value) payload[field] = value;
    }
  }
  return payload;
}
