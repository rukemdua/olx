'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

export async function deleteAdAction(adId: string) {
  try {
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    if (!user) throw new Error('Harap login terlebih dahulu');

    // Pastikan ad ini milik user
    const { data: ad, error: adError } = await serverClient
      .from('ads')
      .select('user_id')
      .eq('id', adId)
      .single();
      
    if (adError || !ad) throw new Error('Iklan tidak ditemukan');
    if (ad.user_id !== user.id) throw new Error('Anda tidak berhak menghapus iklan ini');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const adminClient = supabaseServiceKey 
      ? createSupabaseClient(supabaseUrl, supabaseServiceKey) 
      : serverClient;

    // 1. Ambil semua gambar milik iklan ini
    const { data: images } = await adminClient
      .from('ad_images')
      .select('url')
      .eq('ad_id', adId);

    // 2. Hapus gambar dari Storage
    if (images && images.length > 0) {
      const paths = images
        .map(img => {
          const m = img.url.match(/\/ad_images\/([^?]+)/);
          return m ? m[1] : null;
        })
        .filter(Boolean) as string[];
        
      if (paths.length > 0) {
        await adminClient.storage.from('ad_images').remove(paths);
      }
    }

    // 3. Hapus iklan dari DB (akan otomatis cascade hapus ad_images jika foreign key diset cascade, 
    // tapi kita gunakan service key agar pasti berhasil hapus ads nya juga)
    const { error: deleteError } = await adminClient.from('ads').delete().eq('id', adId);
    if (deleteError) throw deleteError;

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
