'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function startChatAction(adId: string, sellerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (user.id === sellerId) {
    throw new Error("Anda tidak bisa memulai chat dengan diri sendiri.");
  }

  // Cek apakah chat room sudah ada
  const { data: existingRoom } = await supabase
    .from('chat_rooms')
    .select('id')
    .eq('ad_id', adId)
    .eq('buyer_id', user.id)
    .single();

  if (existingRoom) {
    redirect(`/chat?room=${existingRoom.id}`);
  }

  // Jika belum ada, buat room baru
  const { data: newRoom, error } = await supabase
    .from('chat_rooms')
    .insert({
      ad_id: adId,
      buyer_id: user.id,
      seller_id: sellerId
    })
    .select('id')
    .single();

  if (error || !newRoom) {
    throw new Error('Gagal memulai obrolan: ' + (error?.message || 'Unknown error'));
  }

  redirect(`/chat?room=${newRoom.id}`);
}
