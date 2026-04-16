import { requireUser } from '@/lib/auth';
import ProfileForm from './ProfileForm';

export default async function ProfilePage() {
  const ctx = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-white">My profile</h1>
        <p className="mt-1 text-sm text-gray-400">
          Your public profile info. Members in your chapter can see this.
        </p>
      </div>
      <ProfileForm profile={ctx.profile} />
    </div>
  );
}
