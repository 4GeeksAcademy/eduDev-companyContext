"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Header } from "@/components/Header";
import { Feedback } from "@/components/Feedback";
import { AuthApiError, getCurrentUser, logout } from "@/services/auth";

export function SessionGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/login' || pathname === '/register') {
    return <><Header privateActions={false} />{children}</>;
  }
  return <PrivateSession key={pathname}>{children}</PrivateSession>;
}

function PrivateSession({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getCurrentUser(controller.signal).then(() => {
      if (!controller.signal.aborted) setStatus('ready');
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      // The identity client owns cleanup and navigation for missing/invalid sessions.
      if (!(error instanceof AuthApiError && error.status === 401)) setStatus('error');
    });
    return () => controller.abort();
  }, [attempt]);

  if (status === 'ready') return <><Header privateActions />{children}</>;
  return (
    <>
      <Header privateActions={false} />
      <div className="mx-auto max-w-xl space-y-4 px-4 py-8">
        <Feedback type={status === 'loading' ? 'loading' : 'error'}>
          {status === 'loading' ? 'Comprobando sesión…' : 'No se pudo comprobar la sesión. Puedes reintentar sin perderla.'}
        </Feedback>
        {status === 'error' && <div className="flex gap-3">
          <button className="button-primary" onClick={() => {
            setStatus('loading');
            setAttempt((value) => value + 1);
          }}>Reintentar</button>
          <button className="button-secondary" onClick={logout}>Cerrar sesión</button>
        </div>}
      </div>
    </>
  );
}
