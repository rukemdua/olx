import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import ChatClient from './ChatClient';

export const dynamic = 'force-dynamic';

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const initialRoom = typeof resolvedParams.room === 'string' ? resolvedParams.room : undefined;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch semua chat room milik user ini
  const { data: rooms, error } = await supabase
    .from('chat_rooms')
    .select(`
      id,
      buyer_id,
      seller_id,
      ad_id,
      created_at
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Gagal mengambil chat rooms:", error);
  }

  const chatRooms = rooms || [];

  if (chatRooms.length === 0) {
    return (
      <ChatClient
        chats={[]}
        currentUserId={user.id}
        initialRoomId={initialRoom}
      />
    );
  }

  const roomIds = chatRooms.map(r => r.id);
  const adIds = [...new Set(chatRooms.map(r => r.ad_id))];
  const profileIds = [...new Set(chatRooms.flatMap(r => [r.buyer_id, r.seller_id]))];

  const { data: adsData } = await supabase
    .from('ads')
    .select('id, title, price, ad_images(url)')
    .in('id', adIds);

  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', profileIds);

  // Fetch unread count — pesan dari orang lain yang belum dibaca
  const { data: unreadMessages } = await supabase
    .from('messages')
    .select('room_id')
    .in('room_id', roomIds)
    .eq('is_read', false)
    .neq('sender_id', user.id);

  // Fetch pesan terakhir per room untuk preview sidebar
  const { data: lastMessages } = await supabase
    .from('messages')
    .select('room_id, content, created_at, sender_id')
    .in('room_id', roomIds)
    .order('created_at', { ascending: false });

  // Ambil pesan terakhir per room (karena sudah diurut desc, cukup ambil pertama per room)
  const lastMessageMap = new Map<string, { content: string; created_at: string; sender_id: string; is_read: boolean }>();
  if (lastMessages) {
    for (const msg of lastMessages) {
      if (!lastMessageMap.has(msg.room_id)) {
        lastMessageMap.set(msg.room_id, {
          content: msg.content,
          created_at: msg.created_at,
          sender_id: msg.sender_id,
          is_read: msg.is_read,
        });
      }
    }
  }

  const unreadCountMap = new Map<string, number>();
  if (unreadMessages) {
    unreadMessages.forEach(msg => {
      unreadCountMap.set(msg.room_id, (unreadCountMap.get(msg.room_id) || 0) + 1);
    });
  }

  const adsMap = new Map((adsData || []).map(ad => [ad.id, ad]));
  const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));

  // Susun data chat untuk dikirim ke Client
  const formattedChats = chatRooms.map(room => {
    const isBuyer = room.buyer_id === user.id;
    const otherUserId = isBuyer ? room.seller_id : room.buyer_id;

    const ad = adsMap.get(room.ad_id);
    const otherUser = profilesMap.get(otherUserId);
    const lastMsg = lastMessageMap.get(room.id);

    const firstImage = ad?.ad_images?.[0]?.url || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=100&q=80';

    return {
      id: room.id,
      ad_id: room.ad_id,
      ad_title: ad?.title || 'Barang tidak ditemukan',
      ad_price: ad?.price || 0,
      ad_image: firstImage,
      other_user_id: otherUserId,
      other_user_name: otherUser?.full_name || 'Pengguna',
      other_user_avatar: otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.full_name || 'U')}&background=00b56a&color=fff`,
      unread_count: unreadCountMap.get(room.id) || 0,
      last_message: lastMsg?.content || null,
      last_message_at: lastMsg?.created_at || room.created_at,
      last_message_is_mine: lastMsg?.sender_id === user.id,
      last_message_is_read: lastMsg?.is_read || false,
    };
  });

  // Sort by last message time (terbaru di atas)
  formattedChats.sort((a, b) =>
    new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  );

  return (
    <ChatClient
      chats={formattedChats}
      currentUserId={user.id}
      initialRoomId={initialRoom}
    />
  );
}
