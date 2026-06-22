import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';
import styles from './Profile.module.css';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch Profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
  }

  // Fetch Ads by this user
  const { data: myAds, error: adsError } = await supabase
    .from('ads')
    .select('*, ad_images(url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (adsError) {
    console.error("Error fetching ads:", adsError);
  }

  // Siapkan data default jika profileData null
  const safeProfileData = profileData || {
    id: user.id,
    full_name: user.email?.split('@')[0] || 'Pengguna',
    phone: '',
    avatar_url: '',
    created_at: user.created_at || new Date().toISOString()
  };

  return (
    <div className={styles.main}>
      <ProfileClient profileData={safeProfileData} myAds={myAds || []} />
    </div>
  );
}
