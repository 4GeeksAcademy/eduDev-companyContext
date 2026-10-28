export type PasswordMode = 'forgot' | 'reset' | 'change';
export type PasswordValues = { email: string; current_password: string; new_password: string; confirmation: string };

export function validatePasswordForm(mode: PasswordMode, values: PasswordValues): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  if (mode === 'forgot') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = ['Introduce un correo electrónico válido.'];
    return errors;
  }
  for (const field of mode === 'change' ? ['current_password', 'new_password'] as const : ['new_password'] as const) {
    const bytes = new TextEncoder().encode(values[field]).length;
    if (!bytes) errors[field] = ['La contraseña es obligatoria.'];
    else if (bytes > 72) errors[field] = ['La contraseña no puede superar 72 bytes UTF-8.'];
  }
  if (!values.confirmation || values.new_password !== values.confirmation) errors.confirmation = ['Las contraseñas deben coincidir.'];
  return errors;
}

export function resetToken(query: URLSearchParams): string | null {
  const tokens = query.getAll('token');
  return tokens.length === 1 && tokens[0].trim() ? tokens[0] : null;
}
export function resetSucceeded(query: URLSearchParams): boolean {
  return query.getAll('reset').length === 1 && query.get('reset') === 'success';
}
export const FORGOT_CONFIRMATION = 'Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña.';
export const RESET_SUCCESS = 'Contraseña restablecida. Inicia sesión con tu nueva contraseña.';
export function passwordError(mode: PasswordMode, status: number): string {
  if (mode === 'reset' && (status === 400 || status === 401 || status === 422)) return 'El enlace no es válido, ha caducado o ya se ha utilizado. Solicita uno nuevo.';
  if (mode === 'change' && status === 400) return 'La contraseña actual es incorrecta.';
  return 'No se pudo completar la solicitud. Inténtalo de nuevo.';
}
