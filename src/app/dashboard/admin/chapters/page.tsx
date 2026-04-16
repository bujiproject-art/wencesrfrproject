import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Chapter, Profile } from '@/lib/types';
import ChaptersAdminView from './ChaptersAdminView';

export default async function ChaptersAdminPage() {
  const ctx = await requireUser();
  if (!ctx.isSuperAdmin) {
    redirect('/dashboard');
  }

  const admin = createServiceRoleClient();

  const { data: chaptersRaw } = await admin
    .from('chapters')
    .select(
      '*, admin_profile:chapter_admin_id (id, first_name, last_name, email)',
    )
    .order('state', { ascending: true })
    .order('city', { ascending: true });

  const { data: profilesRaw } = await admin
    .from('profiles')
    .select('id, first_name, last_name, email')
    .eq('is_active', true)
    .order('first_name', { ascending: true });

  const chapters = (chaptersRaw ?? []) as (Chapter & {
    admin_profile: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'email'> | null;
  })[];
  const profiles = (profilesRaw ?? []) as Pick<
    Profile,
    'id' | 'first_name' | 'last_name' | 'email'
  >[];

  return <ChaptersAdminView chapters={chapters} allProfiles={profiles} />;
}
