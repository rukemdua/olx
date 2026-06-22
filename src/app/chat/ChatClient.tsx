'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import Image from 'next/image';
import { Paperclip, MoreVertical, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type ChatRoom = {
  id: string;
  ad_id: string;
  ad_title: string;
  ad_price: number;
  ad_image: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string;
  unread_count?: number;
  last_message?: string | null;
  last_message_at?: string;
  last_message_is_mine?: boolean;
  last_message_is_read?: boolean;
};

type Message = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
};

type ChatClientProps = {
  chats: ChatRoom[];
  currentUserId: string;
  initialRoomId?: string;
};

function formatRupiah(number: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatSidebarTime(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Kemarin';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('id-ID', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  }
}

export default function ChatClient({ chats, currentUserId, initialRoomId }: ChatClientProps) {
  const supabase = createClient();
  const [localChats, setLocalChats] = useState<ChatRoom[]>(chats);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialRoomId || (chats.length > 0 ? chats[0].id : null));
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(initialRoomId ? 'chat' : 'list');

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Refs agar callback realtime selalu baca nilai terbaru
  // tanpa perlu re-subscribe setiap kali state berubah
  const activeChatIdRef = useRef<string | null>(activeChatId);
  const localChatsRef = useRef<ChatRoom[]>(localChats);

  const activeChat = localChats.find(c => c.id === activeChatId);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Jaga refs selalu sinkron dengan state terbaru
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    localChatsRef.current = localChats;
  }, [localChats]);

  // Fetch messages when active room changes
  useEffect(() => {
    if (!activeChatId) return;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', activeChatId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);

        // Reset unread_count for this active room locally
        setLocalChats(prev => prev.map(c =>
          c.id === activeChatId ? { ...c, unread_count: 0 } : c
        ));

        // Tandai pesan dari orang lain sebagai sudah dibaca
        const unreadMsgIds = data
          .filter(m => !m.is_read && m.sender_id !== currentUserId)
          .map(m => m.id);

        if (unreadMsgIds.length > 0) {
          const { error: updateError } = await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadMsgIds);
            
          if (updateError) {
            console.error('❌ Gagal menandai pesan sebagai sudah dibaca:', updateError);
          } else {
            // Dispatch custom event agar Header langsung merefresh unread count
            window.dispatchEvent(new CustomEvent('messages_read'));
          }
        }
      }
      setIsLoadingMessages(false);
    };

    fetchMessages();
  }, [activeChatId, supabase]);

  // Realtime Subscription
  // CATATAN: Supabase Realtime postgres_changes TIDAK mendukung filter `in`.
  // Solusi: subscribe tanpa filter, lakukan pengecekan room_id di sisi client.
  // RLS di Supabase menjamin user hanya menerima event yang berhak dia lihat.
  useEffect(() => {
    // Tidak perlu subscribe jika tidak ada room
    if (localChats.length === 0) return;

    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let channel: ReturnType<typeof supabase.channel>;

    const subscribe = () => {
      // Nama channel TANPA karakter khusus (titik dua ':' bisa sebabkan CHANNEL_ERROR)
      channel = supabase
        .channel('chat_global_listener')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            // Tidak pakai filter — filtering dilakukan client-side di bawah
          },
          (payload) => {
            const newMessage = payload.new as Message;

            // Abaikan jika bukan room milik user ini (gunakan ref yang selalu fresh)
            const myRoomIds = new Set(localChatsRef.current.map(c => c.id));
            if (!myRoomIds.has(newMessage.room_id)) return;

            if (newMessage.room_id === activeChatIdRef.current) {
              // ── Pesan masuk ke room yang sedang aktif ──
              setMessages((prev) => {
                // Cegah duplikat (bisa terjadi karena optimistic update)
                if (prev.find(m => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
              });

              // Update preview sidebar untuk room aktif
              setLocalChats(prev => prev.map(c =>
                c.id === newMessage.room_id
                  ? {
                      ...c,
                      last_message: newMessage.content,
                      last_message_at: newMessage.created_at,
                      last_message_is_mine: newMessage.sender_id === currentUserId,
                      last_message_is_read: newMessage.is_read,
                    }
                  : c
              ));

              // Auto mark as read karena user sedang melihat room ini
              if (newMessage.sender_id !== currentUserId) {
                supabase
                  .from('messages')
                  .update({ is_read: true })
                  .eq('id', newMessage.id)
                  .then(({ error: updateError }) => {
                    if (updateError) {
                      console.error('❌ Gagal menandai pesan baru sebagai sudah dibaca:', updateError);
                    } else {
                      setMessages(prev =>
                        prev.map(m => m.id === newMessage.id ? { ...m, is_read: true } : m)
                      );
                      
                      // Dispatch custom event agar Header langsung merefresh unread count
                      window.dispatchEvent(new CustomEvent('messages_read'));
                    }
                  });
              }
            } else {
              // ── Pesan masuk ke room lain (background) ──
              setLocalChats(prev => prev.map(c =>
                c.id === newMessage.room_id
                  ? {
                      ...c,
                      last_message: newMessage.content,
                      last_message_at: newMessage.created_at,
                      last_message_is_mine: newMessage.sender_id === currentUserId,
                      // Tambah unread hanya jika pesan dari orang lain
                      unread_count: newMessage.sender_id !== currentUserId
                        ? (c.unread_count || 0) + 1
                        : c.unread_count,
                    }
                  : c
              ));
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            // Tidak pakai filter — filtering client-side
          },
          (payload) => {
            const updatedMsg = payload.new as Message;

            // Abaikan jika bukan room milik user ini (gunakan ref yang selalu fresh)
            const myRoomIds = new Set(localChatsRef.current.map(c => c.id));
            if (!myRoomIds.has(updatedMsg.room_id)) return;

            // Update status is_read untuk read receipt (✓✓)
            setMessages(prev =>
              prev.map(m => m.id === updatedMsg.id
                ? { ...m, is_read: updatedMsg.is_read }
                : m
              )
            );
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Realtime] ✅ Terhubung ke realtime channel');
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('[Realtime] ⚠️ Gagal terhubung, coba lagi dalam 3 detik...', err);
            // Auto-retry setelah 3 detik
            retryTimer = setTimeout(() => {
              supabase.removeChannel(channel);
              subscribe();
            }, 3000);
          } else if (status === 'TIMED_OUT') {
            console.warn('[Realtime] ⏱️ Koneksi timeout, coba lagi...');
            retryTimer = setTimeout(() => {
              supabase.removeChannel(channel);
              subscribe();
            }, 3000);
          }
        });
    };

    subscribe();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      supabase.removeChannel(channel);
    };
  // Hanya re-subscribe jika daftar room berubah (user membuka chat baru)
  // activeChatId TIDAK perlu di deps karena kita pakai ref
  }, [localChats.length, supabase, currentUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId) return;

    const newMsgContent = inputText.trim();
    setInputText('');

    // Optimistic UI update
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const tempMessage: Message = {
      id: tempId,
      room_id: activeChatId,
      sender_id: currentUserId,
      content: newMsgContent,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages(prev => [...prev, tempMessage]);

    // Update sidebar preview optimistically
    setLocalChats(prev => prev.map(c =>
      c.id === activeChatId
        ? {
            ...c,
            last_message: newMsgContent,
            last_message_at: new Date().toISOString(),
            last_message_is_mine: true,
          }
        : c
    ));

    // Insert to DB
    const { error, data } = await supabase
      .from('messages')
      .insert({
        room_id: activeChatId,
        sender_id: currentUserId,
        content: newMsgContent,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to send message:', error);
      // Revert optimistic update
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } else if (data) {
      // Replace temp with real message
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    }
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setMobileView('chat');
  };

  // Hitung total unread untuk ditampilkan di title (optional)
  const totalUnread = localChats.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>

        {/* Sidebar List Chat */}
        <div className={`${styles.sidebar} ${mobileView === 'chat' ? styles.hideOnMobile : ''}`}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarTitleRow}>
              <h1 className={styles.sidebarTitle}>Pesan</h1>
              {totalUnread > 0 && (
                <span className={styles.totalUnreadBadge}>{totalUnread > 99 ? '99+' : totalUnread}</span>
              )}
            </div>
          </div>
          <div className={styles.chatList}>
            {localChats.length === 0 ? (
              <div className={styles.emptyState}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: '12px' }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <p>Belum ada percakapan.</p>
                <span>Mulai chat dari halaman iklan.</span>
              </div>
            ) : (
              localChats.map(chat => {
                const hasUnread = (chat.unread_count || 0) > 0;
                const isActive = activeChatId === chat.id;
                return (
                  <div
                    key={chat.id}
                    className={`${styles.chatItem} ${isActive ? styles.active : ''} ${hasUnread ? styles.unread : ''}`}
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <div className={styles.avatarWrapper}>
                      <img src={chat.other_user_avatar} alt="Avatar" className={styles.avatar} />
                      {hasUnread && <span className={styles.onlineDot} />}
                    </div>
                    <div className={styles.chatInfo}>
                      <div className={`${styles.chatName} ${hasUnread ? styles.chatNameUnread : ''}`}>
                        {chat.other_user_name}
                      </div>
                      <div className={`${styles.chatPreview} ${hasUnread ? styles.chatPreviewUnread : ''}`}>
                        {chat.last_message_is_mine && (
                          <span className={styles.previewMine}>
                            Anda: 
                          </span>
                        )}
                        {' '}{chat.last_message || chat.ad_title}
                      </div>
                    </div>
                    <div className={styles.chatMeta}>
                      <div className={`${styles.chatTime} ${hasUnread ? styles.chatTimeUnread : ''}`}>
                        {chat.last_message_at ? formatSidebarTime(chat.last_message_at) : '-'}
                      </div>
                      {hasUnread ? (
                        <div className={styles.unreadBadge}>
                          {chat.unread_count! > 99 ? '99+' : chat.unread_count}
                        </div>
                      ) : chat.last_message_is_mine ? (
                        chat.last_message_is_read ? (
                          <CheckCheck size={15} className={styles.readIcon} />
                        ) : (
                          <Check size={15} className={styles.sentIcon} />
                        )
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`${styles.chatWindow} ${mobileView === 'list' ? styles.hideOnMobile : ''}`}>
          {activeChat ? (
            <>
              {/* Header */}
              <div className={styles.chatHeader}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button className={styles.backBtn} onClick={() => setMobileView('list')}>
                    <ArrowLeft size={24} />
                  </button>
                  <div>
                    <div className={styles.headerProfile}>
                      <img src={activeChat.other_user_avatar} alt="Avatar" className={styles.avatar} />
                      <div>
                        <div className={styles.chatName}>{activeChat.other_user_name}</div>
                        <div className={styles.onlineStatus}>
                          <span className={styles.onlineDotSmall} />
                          Online
                        </div>
                      </div>
                    </div>
                    <div className={styles.itemInfo}>
                      <Image src={activeChat.ad_image} alt="Item" width={40} height={40} className={styles.itemImage}/>
                      <div>
                        <div className={styles.itemTitle}>{activeChat.ad_title}</div>
                        <div className={styles.itemPrice}>{formatRupiah(activeChat.ad_price)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <button className={styles.attachBtn} title="Opsi lainnya">
                  <MoreVertical size={20} />
                </button>
              </div>

              {/* Messages Body */}
              <div className={styles.chatBody}>
                {isLoadingMessages ? (
                  <div className={styles.loadingMessages}>
                    <div className={styles.loadingDots}>
                      <span/><span/><span/>
                    </div>
                    Memuat pesan...
                  </div>
                ) : messages.length === 0 ? (
                  <div className={styles.emptyMessages}>
                    <div className={styles.emptyMessageIcon}>👋</div>
                    <p>Belum ada pesan.</p>
                    <span>Mulai obrolan sekarang!</span>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = msg.sender_id === currentUserId;
                    const isLastMine = isMine && idx === messages.length - 1;
                    return (
                      <div key={msg.id} className={`${styles.message} ${isMine ? styles.sent : styles.received}`}>
                        <span className={styles.messageContent}>{msg.content}</span>
                        <div className={styles.messageMeta}>
                          <span className={styles.messageTime}>{formatTime(msg.created_at)}</span>
                          {isMine && (
                            <span className={styles.readReceipt} title={msg.is_read ? 'Dibaca' : 'Terkirim'}>
                              {msg.is_read
                                ? <CheckCheck size={13} className={styles.readIcon} />
                                : <Check size={13} className={styles.sentIcon} />
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Footer / Input */}
              <form className={styles.chatFooter} onSubmit={handleSendMessage}>
                <button type="button" className={styles.attachBtn} title="Kirim Gambar">
                  <Paperclip size={20} />
                </button>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    className={styles.messageInput}
                    placeholder="Ketik pesan di sini..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <button type="submit" className={styles.sendBtn} title="Kirim Pesan" disabled={!inputText.trim()}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '-2px' }}>
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <div className={styles.noChatSelected}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <h3>Pilih percakapan</h3>
              <p>Pilih pesan di sebelah kiri untuk mulai membaca</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
