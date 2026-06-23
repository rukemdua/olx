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

export async function reorderAdImagesAction(adId: string, orderedUrls: string[]) {
  try {
    // 1. Cek Autentikasi
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    if (!user) throw new Error('Harap login terlebih dahulu');

    // 2. Verifikasi
    const { data: ad } = await serverClient.from('ads').select('user_id').eq('id', adId).single();
    if (!ad || ad.user_id !== user.id) throw new Error('Akses ditolak');

    const adminClient = process.env.SUPABASE_SERVICE_ROLE_KEY 
      ? createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
      : serverClient;

    // 3. Hapus semua record ad_images di DB untuk iklan ini (TIDAK MENGHAPUS FILE STORAGE)
    const { error: delErr } = await adminClient.from('ad_images').delete().eq('ad_id', adId);
    if (delErr) throw delErr;

    // 4. Insert kembali dengan urutan yang benar
    if (orderedUrls.length > 0) {
      const inserts = orderedUrls.map(url => ({ ad_id: adId, url }));
      const { error: insErr } = await adminClient.from('ad_images').insert(inserts);
      if (insErr) throw insErr;
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

