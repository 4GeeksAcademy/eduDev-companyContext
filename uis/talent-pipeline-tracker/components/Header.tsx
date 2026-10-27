"use client";

import Link from "next/link";
import { logout } from "@/services/auth";

export function Header({ privateActions }: { privateActions: boolean }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="text-lg font-bold text-slate-950">
          TrackFlow People &amp; Talent
        </Link>
        {privateActions && <nav className="flex items-center gap-4 text-sm font-medium" aria-label="Navegación principal">
          <Link href="/" className="text-slate-600 hover:text-blue-700">
            Candidaturas
          </Link>
          <Link href="/candidates/new" className="rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800">
            Nueva candidatura
          </Link>
          <Link href="/account/profile" className="text-slate-600 hover:text-blue-700">Perfil</Link>
          <button onClick={logout} className="text-slate-600 hover:text-blue-700">Cerrar sesión</button>
        </nav>}
      </div>
    </header>
  );
}
