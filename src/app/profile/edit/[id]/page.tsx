import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import EditAdClient from './EditAdClient';

export const dynamic = 'force-dynamic';

export default async function EditAdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/login');

  const { data: ad, error } = await supabase
    .from('ads')
    .select('*, ad_images(id, url)')
    .eq('id', id)
    .eq('user_id', user.id) // pastikan hanya pemilik yang bisa edit
    .single();

  if (error || !ad) notFound();

  return <EditAdClient ad={ad} />;
}
