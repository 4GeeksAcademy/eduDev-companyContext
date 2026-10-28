"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PasswordForm } from '@/components/PasswordForm';
import { resetToken } from '@/lib/password-form';

function ResetContent() {
  const query = useSearchParams();
  const token = resetToken(new URLSearchParams(query.toString()));
  return <PasswordForm key={token} mode="reset" token={token} />;
}
export default function ResetPasswordPage() {
  return <Suspense fallback={<p>Cargando…</p>}><ResetContent /></Suspense>;
}
