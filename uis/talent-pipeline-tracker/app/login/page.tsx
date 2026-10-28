"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';
import { RESET_SUCCESS, resetSucceeded } from '@/lib/password-form';

function LoginContent() {
  const query = useSearchParams();
  return <AuthForm successMessage={resetSucceeded(new URLSearchParams(query.toString())) ? RESET_SUCCESS : ''} />;
}
export default function LoginPage() {
  return <Suspense fallback={<p>Cargando…</p>}><LoginContent /></Suspense>;
}
