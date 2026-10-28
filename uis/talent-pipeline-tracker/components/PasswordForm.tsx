"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Feedback } from '@/components/Feedback';
import { FORGOT_CONFIRMATION, passwordError, validatePasswordForm, type PasswordMode, type PasswordValues } from '@/lib/password-form';
import { AuthApiError, changePassword, forgotPassword, resetPassword } from '@/services/auth';

const empty: PasswordValues = { email: '', current_password: '', new_password: '', confirmation: '' };
const fields = [
  { name: 'email', label: 'Correo electrónico', type: 'email', autoComplete: 'email' },
  { name: 'current_password', label: 'Contraseña actual', type: 'password', autoComplete: 'current-password' },
  { name: 'new_password', label: 'Nueva contraseña', type: 'password', autoComplete: 'new-password' },
  { name: 'confirmation', label: 'Confirmar nueva contraseña', type: 'password', autoComplete: 'new-password' },
] as const;

export function PasswordForm({ mode, token = null }: { mode: PasswordMode; token?: string | null }) {
  const router = useRouter();
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const submitting = useRef(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); request.current = null; }, []);
  const title = mode === 'forgot' ? 'Recuperar contraseña' : mode === 'reset' ? 'Restablecer contraseña' : 'Cambiar contraseña';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || done || (mode === 'reset' && !token)) return;
    const nextErrors = validatePasswordForm(mode, values);
    setErrors(nextErrors); setMessage('');
    if (Object.keys(nextErrors).length) return;
    submitting.current = true; setPending(true); setSuccess(false);
    const controller = new AbortController();
    request.current = controller;
    const isCurrent = () => request.current === controller && !controller.signal.aborted;
    try {
      if (mode === 'forgot') await forgotPassword({ email: values.email.trim() }, controller.signal);
      else if (mode === 'reset') await resetPassword({ token: token!, new_password: values.new_password }, controller.signal);
      else await changePassword({ current_password: values.current_password, new_password: values.new_password }, controller.signal);
      if (!isCurrent()) return;
      if (mode === 'reset') { router.replace('/login?reset=success'); return; }
      setSuccess(true); setDone(true); setValues(empty);
      setMessage(mode === 'forgot' ? FORGOT_CONFIRMATION : 'Contraseña cambiada correctamente.');
    } catch (error) {
      if (!isCurrent()) return;
      // Recovery always confirms generically, including network/provider failures.
      if (mode === 'forgot') { setSuccess(true); setDone(true); setMessage(FORGOT_CONFIRMATION); }
      else setMessage(passwordError(mode, error instanceof AuthApiError ? error.status : 0));
    }
    if (!isCurrent()) return;
    submitting.current = false; setPending(false);
  }

  return <section className="mx-auto max-w-md space-y-6">
    <h1 className="text-2xl font-bold">{title}</h1>
    {mode === 'reset' && !token ? <Feedback type="error">El enlace no es válido. Solicita uno nuevo.</Feedback> :
      <form noValidate onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        {fields.filter(field => mode === 'forgot' ? field.name === 'email' : field.name !== 'email' && (mode === 'change' || field.name !== 'current_password')).map(field => <div key={field.name}>
          <label htmlFor={field.name} className="mb-1 block text-sm font-medium">{field.label}</label>
          <input id={field.name} name={field.name} type={field.type} autoComplete={field.autoComplete}
            className="field" required disabled={pending || done} value={values[field.name]}
            aria-invalid={Boolean(errors[field.name])} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
            onChange={event => { setValues({ ...values, [field.name]: event.target.value }); setErrors({}); setMessage(''); }} />
          {errors[field.name] && <p id={`${field.name}-error`} role="alert" className="text-sm text-red-700">{errors[field.name].join(' ')}</p>}
        </div>)}
        {message && <Feedback type={success ? 'success' : 'error'}>{message}</Feedback>}
        <button className="button-primary disabled:opacity-50" disabled={pending || done}>{pending ? 'Enviando…' : title}</button>
      </form>}
    {mode === 'reset' && <Link className="block text-blue-700 underline" href="/forgot-password">Solicitar un nuevo enlace</Link>}
    <Link className="block text-blue-700 underline" href={mode === 'change' ? '/account/profile' : '/login'}>{mode === 'change' ? 'Volver al perfil' : 'Ir a iniciar sesión'}</Link>
  </section>;
}
