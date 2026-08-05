'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/lib/store/useChatStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import { mediaUrl } from '@/lib/api';
import { isOnline, lastSeenText } from '@/lib/timeAgo';
import styles from './MessagesPage.module.css';

export default function MessagesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { conversations, fetchConversations, openChat } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    fetchConversations();
  }, [isAuthenticated, fetchConversations, router]);

  const convList = Object.values(conversations).sort((a, b) => {
    const aTime = a.messages[a.messages.length - 1]?.timestamp ?? 0;
    const bTime = b.messages[b.messages.length - 1]?.timestamp ?? 0;
    return bTime - aTime;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Messages</h1>
      </div>

      {convList.length === 0 ? (
        <div className={styles.empty}>
          <p>No conversations yet.</p>
          <p>Contact an agent or roommate to start chatting.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {convList.map((conv) => {
            const lastMsg = conv.messages[conv.messages.length - 1];
            const avatarSrc = conv.contact.avatarUrl ? mediaUrl(conv.contact.avatarUrl) : '';
            const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.contact.name || 'User')}&background=0F172A&color=fff&size=128&bold=true`;

            return (
              <button
                key={conv.conversation_id}
                className={styles.convItem}
                onClick={() => openChat(conv.contact)}
              >
                <div className={styles.avatarWrap}>
                  <ProtectedImage
                    src={avatarSrc || fallbackAvatar}
                    fallbackSrc={fallbackAvatar}
                    alt={conv.contact.name}
                    className={styles.avatar}
                  />
                  {isOnline(conv.contact.lastSeenAt) && (
                    <span className={styles.onlineDot} />
                  )}
                </div>

                <div className={styles.info}>
                  <div className={styles.nameRow}>
                    <span className={styles.name}>{conv.contact.name}</span>
                    {lastMsg && (
                      <span className={styles.time}>
                        {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className={styles.previewRow}>
                    <span className={styles.preview}>
                      {lastMsg ? (lastMsg.sender === 'user' ? `You: ${lastMsg.text}` : lastMsg.text) : 'No messages yet'}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className={styles.badge}>{conv.unreadCount > 99 ? '99+' : conv.unreadCount}</span>
                    )}
                  </div>
                  <span className={styles.status}>{lastSeenText(conv.contact.lastSeenAt)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
