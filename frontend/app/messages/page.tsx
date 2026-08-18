'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore, type Message } from '@/lib/store/useChatStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { BrandedAvatar } from '@/components/ui/BrandedAvatar';
import { mediaUrl } from '@/lib/api';
import { isOnline, lastSeenText } from '@/lib/timeAgo';
import styles from './MessagesPage.module.css';

function previewText(msg: Message, t: (key: string) => string): string {
  if (msg.message_type === 'image') return `[${t('chat_image_sent')}]`;
  if (msg.message_type === 'voice') return `[${t('chat_voice_sent')}]`;
  if (msg.message_type === 'listing') return msg.listing ? `[${t('chat_apartment')}: ${msg.listing.title}]` : `[${t('chat_apartment')}]`;
  return msg.text || '';
}

export default function MessagesPage() {
  const router = useRouter();
  const t = useLanguageStore((s) => s.t);
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const { conversations, fetchConversations, openChat, startSupportChat } = useChatStore();

  useEffect(() => {
    if (!hasHydrated) return; // wait for persisted store to rehydrate on refresh
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    fetchConversations();
  }, [hasHydrated, isAuthenticated, fetchConversations, router]);

  const convList = Object.values(conversations).sort((a, b) => {
    const aTime = a.lastMessageAt ?? a.messages[a.messages.length - 1]?.timestamp ?? 0;
    const bTime = b.lastMessageAt ?? b.messages[b.messages.length - 1]?.timestamp ?? 0;
    return bTime - aTime;
  });

  if (!hasHydrated) {
    return null;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('ms_title')}</h1>
        <button className={styles.supportBtn} onClick={() => startSupportChat()}>
          <span className={styles.supportIcon}>?</span> {t('ms_contact_support')}
        </button>
      </div>

      {convList.length === 0 ? (
        <div className={styles.empty}>
          <p>{t('ms_no_conversations')}</p>
          <p>{t('ms_no_conversations_sub')}</p>
        </div>
      ) : (
        <div className={styles.list}>
          {convList.map((conv) => {
            const lastMsg = conv.messages[conv.messages.length - 1];
            const avatarSrc = conv.contact.avatarUrl ? mediaUrl(conv.contact.avatarUrl) : '';
            const lastSeen = lastSeenText(conv.contact.lastSeenAt);

            return (
              <button
                key={conv.conversation_id}
                className={styles.convItem}
                onClick={() => openChat(conv.contact)}
              >
                <div className={styles.avatarWrap}>
                  <BrandedAvatar
                    src={avatarSrc || null}
                    name={conv.contact.name}
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
                      {lastMsg ? (lastMsg.sender === 'user' ? `${t('ms_you')}${previewText(lastMsg, t)}` : previewText(lastMsg, t)) : t('no_messages_yet')}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className={styles.badge}>{conv.unreadCount > 99 ? '99+' : conv.unreadCount}</span>
                    )}
                  </div>
                  <span className={styles.status}>{t(lastSeen.key, lastSeen.params)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
