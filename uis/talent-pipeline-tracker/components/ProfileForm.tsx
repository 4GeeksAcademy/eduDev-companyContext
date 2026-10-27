"use client";

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Feedback } from '@/components/Feedback';
import { profilePayload, profileValues, type ProfileValues } from '@/lib/profile-form';
import { AuthApiError, getCurrentUser, updateProfile } from '@/services/auth';

const fields = [
  { name: 'name', label: 'Nombre', type: 'text', autoComplete: 'name' },
  { name: 'phone', label: 'Teléfono', type: 'tel', autoComplete: 'tel' },
  { name: 'address', label: 'Dirección', type: 'text', autoComplete: 'street-address' },
] as const;

export function ProfileForm() {
  const [values, setValues] = useState<ProfileValues | null>(null);
  const [email, setEmail] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const request = useRef<AbortController | null>(null);
  const submitting = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    request.current = controller;
    getCurrentUser(controller.signal).then((user) => {
      if (request.current !== controller || controller.signal.aborted) return;
      setEmail(user.email);
      setValues(profileValues(user.profile));
    }).catch(() => {
      if (request.current === controller && !controller.signal.aborted) setLoadError(true);
    });
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [attempt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values || submitting.current) return;
    submitting.current = true;
    setPending(true);
    setMessage('');
    setErrors({});
    setSuccess(false);
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const isCurrent = () => request.current === controller && !controller.signal.aborted;
    try {
      const profile = await updateProfile(profilePayload(values), controller.signal);
      if (!isCurrent()) return;
      setValues(profileValues(profile));
      setSuccess(true);
      setMessage('Perfil actualizado.');
    } catch (error) {
      if (!isCurrent()) return;
      if (error instanceof AuthApiError) {
        setErrors(error.fieldErrors);
        setMessage(error.message);
      } else {
        setMessage('No se pudo conectar. Comprueba la conexión e inténtalo de nuevo.');
      }
    } finally {
      if (isCurrent()) {
        submitting.current = false;
        setPending(false);
      }
    }
  }

  if (!values) return (
    <div className="space-y-4">
      <Feedback type={loadError ? 'error' : 'loading'}>
        {loadError ? 'No se pudo cargar el perfil.' : 'Cargando perfil…'}
      </Feedback>
      {loadError && <button className="button-primary" onClick={() => {
        setLoadError(false);
        setAttempt((value) => value + 1);
      }}>Reintentar</button>}
    </div>
  );

  return (
    <form noValidate onSubmit={submit} aria-busy={pending}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <div>
        <label htmlFor="profile-email" className="mb-1 block text-sm font-medium">Correo electrónico (solo lectura)</label>
        <input id="profile-email" type="email" className="field" value={email} readOnly />
      </div>
      {fields.map((field) => (
        <div key={field.name}>
          <label htmlFor={`profile-${field.name}`} className="mb-1 block text-sm font-medium">{field.label} (opcional)</label>
          <input id={`profile-${field.name}`} name={field.name} type={field.type} className="field"
            autoComplete={field.autoComplete} value={values[field.name]} disabled={pending}
            aria-invalid={Boolean(errors[field.name]?.length)}
            aria-describedby={errors[field.name]?.length ? `profile-${field.name}-error` : undefined}
            onChange={(event) => {
              setValues({ ...values, [field.name]: event.target.value });
              setErrors({});
              setMessage('');
              setSuccess(false);
            }} />
          {errors[field.name]?.length > 0 && (
            <p id={`profile-${field.name}-error`} className="mt-1 text-sm text-red-700" role="alert">
              {errors[field.name].join(' ')}
            </p>
          )}
        </div>
      ))}
      {message && <Feedback type={success ? 'success' : 'error'}>{message}</Feedback>}
      {Object.entries(errors).filter(([field]) => !fields.some((item) => item.name === field)).map(([field, messages]) => (
        <Feedback key={field} type="error">{messages.join(' ')}</Feedback>
      ))}
      <button className="button-primary disabled:opacity-50" disabled={pending}>
        {pending ? 'Guardando…' : 'Guardar perfil'}
      </button>
    </form>
  );
}
