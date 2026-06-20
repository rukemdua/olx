"use client";

import { useState } from 'react';
import styles from './page.module.css';
import Image from 'next/image';
import { Paperclip, MoreVertical, ArrowLeft } from 'lucide-react';

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState(1);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const chats = [
    { id: 1, name: 'Budi Santoso', item: 'Honda Brio E Satya 2020', preview: 'Bisa nego gak gan?', time: '10:30', unread: 2 },
    { id: 2, name: 'Siti Aminah', item: 'iPhone 13 Pro Max', preview: 'Lokasi COD dimana ya?', time: 'Kemarin', unread: 0 },
    { id: 3, name: 'Toko Elektronik Jaya', item: 'TV Samsung 43 Inch', preview: 'Barang masih ready kak, silakan diorder.', time: '2 Hari lalu', unread: 0 },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Sidebar List Chat */}
      <div className={`${styles.sidebar} ${mobileView === 'chat' ? styles.hideOnMobile : ''}`}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.sidebarTitle}>Pesan</h1>
        </div>
        <div className={styles.chatList}>
          {chats.map(chat => (
            <div 
              key={chat.id} 
              className={`${styles.chatItem} ${activeChat === chat.id ? styles.active : ''}`}
              onClick={() => {
                setActiveChat(chat.id);
                setMobileView('chat');
              }}
            >
              <div className={styles.avatar}>{chat.name.charAt(0)}</div>
              <div className={styles.chatInfo}>
                <div className={styles.chatName}>{chat.name}</div>
                <div className={styles.chatPreview}>{chat.preview}</div>
              </div>
              <div className={styles.chatMeta}>
                <div className={styles.chatTime}>{chat.time}</div>
                {chat.unread > 0 && <div className={styles.unreadBadge}>{chat.unread}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`${styles.chatWindow} ${mobileView === 'list' ? styles.hideOnMobile : ''}`}>
        <div className={styles.chatHeader}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className={styles.backBtn} onClick={() => setMobileView('list')}>
              <ArrowLeft size={24} />
            </button>
            <div>
              <div className={styles.headerProfile}>
                <div className={styles.avatar}>B</div>
                <div>
                  <div className={styles.chatName}>Budi Santoso</div>
                  <div className={styles.chatTime}>Online</div>
                </div>
              </div>
              <div className={styles.itemInfo}>
                <Image src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=100&q=80" alt="Item" width={40} height={40} className={styles.itemImage}/>
                <div>
                  <div className={styles.itemTitle}>Honda Brio E Satya 2020</div>
                  <div className={styles.itemPrice}>Rp 145.000.000</div>
                </div>
              </div>
            </div>
          </div>
          <button className={styles.attachBtn} title="Opsi lainnya">
            <MoreVertical size={20} />
          </button>
        </div>

        <div className={styles.chatBody}>
          <div className={`${styles.message} ${styles.received}`}>
            Halo gan, barangnya masih ada?
            <span className={styles.messageTime}>10:28</span>
          </div>
          <div className={`${styles.message} ${styles.sent}`}>
            Halo Budi, iya masih ada nih. Mau liat-liat dulu?
            <span className={styles.messageTime}>10:29</span>
          </div>
          <div className={`${styles.message} ${styles.received}`}>
            Bisa nego gak gan?
            <span className={styles.messageTime}>10:30</span>
          </div>
        </div>

        <div className={styles.chatFooter}>
          <button className={styles.attachBtn} title="Kirim Gambar">
            <Paperclip size={20} />
          </button>
          <div className={styles.inputWrapper}>
            <input type="text" className={styles.messageInput} placeholder="Ketik pesan di sini..." />
          </div>
          <button className={styles.sendBtn} title="Kirim Pesan">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '-2px' }}>
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
