import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
  const timestamp = new Date().toISOString();
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasSupabase) {
    return NextResponse.json(
      { ok: false, db: 'misconfigured', error: 'Supabase env vars missing', timestamp },
      { status: 503 },
    );
  }

  try {
    const admin = createServiceRoleClient();
    const { error } = await admin
      .from('chapters')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      return NextResponse.json(
        { ok: false, db: 'error', error: error.message, timestamp },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true, db: 'connected', timestamp }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, db: 'error', error: message, timestamp },
      { status: 503 },
    );
  }
}
