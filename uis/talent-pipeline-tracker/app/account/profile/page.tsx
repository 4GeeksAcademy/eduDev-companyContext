import { ProfileForm } from '@/components/ProfileForm';

export default function ProfilePage() {
  return (
    <section className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Mi perfil</h1>
      <ProfileForm />
    </section>
  );
}
