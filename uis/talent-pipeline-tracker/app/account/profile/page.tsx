import Link from 'next/link';
import { ProfileForm } from '@/components/ProfileForm';

export default function ProfilePage() {
  return (
    <section className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Mi perfil</h1>
      <ProfileForm />
      <Link className="block text-blue-700 underline" href="/account/change-password">Cambiar contraseña</Link>
    </section>
  );
}
