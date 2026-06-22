'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

export async function deleteAdImageAction(url: string, adId: string) {
  try {
    // 1. Cek Autentikasi
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    if (!user) throw new Error('Harap login terlebih dahulu');

    // 2. Verifikasi kepemilikan iklan
    const { data: ad, error: adError } = await serverClient
      .from('ads')
      .select('user_id')
      .eq('id', adId)
      .single();
      
    if (adError || !ad) throw new Error('Iklan tidak ditemukan');
    if (ad.user_id !== user.id) throw new Error('Anda tidak berhak menghapus gambar ini');

    // 3. Gunakan Service Role Key untuk bypass RLS (karena RLS DELETE mungkin belum diset)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    // Jika service key tidak ada, fallback ke serverClient (meskipun bisa gagal karena RLS)
    const adminClient = supabaseServiceKey 
      ? createSupabaseClient(supabaseUrl, supabaseServiceKey) 
      : serverClient;

    // 4. Hapus dari Storage
    const match = url.match(/\/ad_images\/([^?]+)/);
    if (match) {
      const { error: storageErr } = await adminClient.storage.from('ad_images').remove([match[1]]);
      if (storageErr) {
        console.warn('Storage delete warning:', storageErr);
      }
    }

    // 5. Hapus dari Database
    const { error: dbErr } = await adminClient.from('ad_images').delete().eq('url', url);
    if (dbErr) throw dbErr;

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
