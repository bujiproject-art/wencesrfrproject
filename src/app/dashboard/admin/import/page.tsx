import { requireUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ImportConsole from './ImportConsole';

export default async function ImportPage() {
  const ctx = await requireUser();
  if (!ctx.isSuperAdmin) {
    redirect('/dashboard');
  }
  return <ImportConsole />;
}
