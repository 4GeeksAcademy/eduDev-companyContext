"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { Feedback } from "@/components/Feedback";
import { authPayload, validateAuth, type AuthValues } from "@/lib/auth-form";
import { AuthApiError, login, register } from "@/services/auth";

const fields = [
  { name: 'email', label: 'Correo electrónico', type: 'email', autoComplete: 'email' },
  { name: 'password', label: 'Contraseña', type: 'password', autoComplete: 'current-password' },
  { name: 'name', label: 'Nombre (opcional)', type: 'text', autoComplete: 'name' },
  { name: 'phone', label: 'Teléfono (opcional)', type: 'tel', autoComplete: 'tel' },
  { name: 'address', label: 'Dirección (opcional)', type: 'text', autoComplete: 'street-address' },
] as const;

function readable(message: string): string {
  const translations: Record<string, string> = {
    'Email already registered': 'Este correo electrónico ya está registrado.',
    'Field required': 'Este campo es obligatorio.',
    'Value error, invalid email address': 'Introduce un correo electrónico válido.',
  };
  return translations[message] ?? message;
}

export function AuthForm({ registration = false }: { registration?: boolean }) {
  const router = useRouter();
  const [values, setValues] = useState<AuthValues>({ email: '', password: '', name: '', phone: '', address: '' });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState(false);
  const submitting = useRef(false);
  const title = registration ? 'Crear cuenta' : 'Iniciar sesión';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || created) return;
    const nextErrors = validateAuth(values);
    setErrors(nextErrors);
    setMessage('');
    if (Object.keys(nextErrors).length) return;
    submitting.current = true;
    setPending(true);
    try {
      await (registration ? register : login)(authPayload(values, registration));
      router.replace('/');
      // Keep submission locked while navigation completes.
    } catch (error) {
      if (error instanceof AuthApiError) {
        setErrors(error.fieldErrors);
        setCreated(error.accountCreated);
        setMessage(error.message);
      } else {
        setMessage('No se pudo conectar. Comprueba la conexión e inténtalo de nuevo.');
      }
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <form noValidate onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        {fields.filter((_, index) => registration || index < 2).map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="mb-1 block text-sm font-medium">{field.label}</label>
            <input id={field.name} name={field.name} type={field.type} className="field"
              autoComplete={field.name === 'password' && registration ? 'new-password' : field.autoComplete}
              required={field.name === 'email' || field.name === 'password'}
              value={values[field.name]} disabled={pending}
              aria-invalid={Boolean(errors[field.name]?.length)}
              aria-describedby={errors[field.name]?.length ? `${field.name}-error` : undefined}
              onChange={(event) => {
                setValues({ ...values, [field.name]: event.target.value });
                setErrors({});
                setMessage('');
                setCreated(false);
              }} />
            {errors[field.name]?.length > 0 && (
              <p id={`${field.name}-error`} className="mt-1 text-sm text-red-700" role="alert">
                {errors[field.name].map(readable).join(' ')}
              </p>
            )}
          </div>
        ))}
        {message && <Feedback type={created ? 'success' : 'error'}>{message}</Feedback>}
        {Object.entries(errors).filter(([field]) => !fields.some((item) => item.name === field)).map(([field, messages]) => (
          <Feedback key={field} type="error">{messages.map(readable).join(' ')}</Feedback>
        ))}
        {created && <p className="text-sm">Para registrar otra cuenta, cambia los datos de forma consciente.</p>}
        <button className="button-primary disabled:opacity-50" disabled={pending || created}>
          {pending ? 'Enviando…' : title}
        </button>
      </form>
      <Link className="text-blue-700 underline" href={registration ? '/login' : '/register'}>
        {registration ? 'Ir a iniciar sesión' : 'Crear una cuenta'}
      </Link>
    </section>
  );
}
