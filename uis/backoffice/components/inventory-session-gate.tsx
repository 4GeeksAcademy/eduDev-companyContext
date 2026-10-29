'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getCurrentUser, getToken, logout, TOKEN_KEY } from '../auth.js';

export default function InventorySessionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const route = `${pathname}?${search}`;
  const [session, setSession] = useState<{ route: string; token: string | null } | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let controller: AbortController;
    const validate = () => {
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      const token = getToken();
      setSession(null);
      setFailed(false);
      void getCurrentUser({ signal }).then(() => {
        if (!signal.aborted && token === getToken()) setSession({ route, token });
      }).catch(() => {
        if (!signal.aborted) setFailed(true);
      });
    };
    const hide = () => { controller?.abort(); setSession(null); };
    const storage = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY || event.key === null) validate();
    };
    const restore = (event: PageTransitionEvent) => { if (event.persisted) validate(); };
    validate();
    window.addEventListener('storage', storage);
    window.addEventListener('pagehide', hide);
    window.addEventListener('pageshow', restore);
    return () => {
      controller.abort();
      window.removeEventListener('storage', storage);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('pageshow', restore);
    };
  }, [route, attempt]);

  if (session?.route !== route || session.token !== getToken()) {
    return <main><h1>Inventory session</h1>{failed ? <>
      <p role="alert">Unable to validate your session. Retry or sign out.</p>
      <button onClick={() => setAttempt(value => value + 1)}>Retry</button>
      <button onClick={logout}>Sign out</button>
    </> : <p role="status">Validating your session…</p>}</main>;
  }
  return <><a href="#main-content">Skip to inventory</a>
    <nav aria-label="Backoffice"><a href={`/uis/backoffice/index.html${search ? `?${search}` : ''}`}>Operations overview</a>{' '}
      <button onClick={logout}>Sign out</button></nav>{children}</>;
}
