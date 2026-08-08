'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Paperclip, Image as ImageIcon, Mic, Square, Phone, Building2, Play, Pause, ArrowLeft, Search } from 'lucide-react';
import { useChatStore, type Message } from '@/lib/store/useChatStore';
import { apiRequest, mediaUrl } from '@/lib/api';

import styles from './ChatPanel.module.css';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import { isOnline } from '@/lib/timeAgo';
import { useLanguageStore } from '@/lib/store/useLanguageStore';

interface ListingOption {
  id: number;
  title: string;
  price: number;
  currency: string;
  house_type?: string;
  location: string;
  photo_url?: string | null;
}

export function ChatPanel() {
  const {
    isOpen, activeAgentId, activeConversationId, conversations, closeChat,
    sendMessage, sendImage, sendVoice, sendListing,
    chatError, clearChatError, isLoadingMessages,
  } = useChatStore();
  const { t } = useLanguageStore();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showListingPicker, setShowListingPicker] = useState(false);
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [listingSearch, setListingSearch] = useState('');
  const [listingsLoading, setListingsLoading] = useState(false);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recorderTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeConversation = activeAgentId ? conversations[activeAgentId] : null;

  const getLocalizedLastSeenText = (lastSeenAt: string | null | undefined) => {
    if (!lastSeenAt) return t('chat_offline');

    const date = new Date(lastSeenAt.endsWith('Z') ? lastSeenAt : `${lastSeenAt}Z`);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return t('chat_online_now');
    if (diffMin < 60) return t('chat_last_seen_min').replace('{count}', String(diffMin));

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return t('chat_last_seen_hour').replace('{count}', String(diffHours));

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return t('chat_last_seen_yesterday');
    if (diffDays < 7) return t('chat_last_seen_days').replace('{count}', String(diffDays));

    return t('chat_offline');
  };

  // Auto-scroll to bottom when messages change or conversation opens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: activeAgentId ? 'auto' : 'smooth' });
  }, [activeConversation?.messages, activeAgentId, isLoadingMessages]);

  // Reset transient state when chat closes or switches conversation
  useEffect(() => {
    if (!isOpen) {
      setMessage('');
      setImagePreview(null);
      setImageFile(null);
      setShowListingPicker(false);
      setListingSearch('');
      setPlayingUrl(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopRecording();
    }
  }, [isOpen, activeAgentId]);

  // Poll for new messages every 5 seconds while chat is open
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const { fetchMessages } = useChatStore.getState();
    if (isOpen && activeConversationId) {
      interval = setInterval(() => {
        fetchMessages(activeConversationId);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, activeConversationId]);

  // Load listings for the picker
  const loadListings = useCallback(async () => {
    setListingsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page_size', '50');
      if (listingSearch.trim()) params.set('keyword', listingSearch.trim());
      const data = await apiRequest(`/listings?${params.toString()}`, { auth: false });
      const items: any[] = data.items || [];
      setListings(items.map((l) => ({
        id: l.id,
        title: l.title,
        price: l.price,
        currency: l.currency || '£',
        house_type: l.house_type,
        location: l.location,
        photo_url: l.photos?.[0]?.url || null,
      })));
    } catch (e) {
      console.error('Failed to load listings', e);
      setListings([]);
    } finally {
      setListingsLoading(false);
    }
  }, [listingSearch]);

  useEffect(() => {
    if (showListingPicker) {
      loadListings();
    }
  }, [showListingPicker, loadListings]);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleSendImage = () => {
    if (!imageFile) return;
    sendImage(imageFile);
    setImagePreview(null);
    setImageFile(null);
  };

  const handleSendListing = (listingId: number) => {
    sendListing(listingId);
    setShowListingPicker(false);
  };

  const togglePlay = (url: string) => {
    if (!url) return;
    if (playingUrl === url && audioRef.current) {
      audioRef.current.pause();
      setPlayingUrl(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlayingUrl(null);
    setPlayingUrl(url);
    audio.play().catch(() => {});
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordingSeconds(0);
    setRecordingError(null);
    if (recorderTimerRef.current) {
      clearInterval(recorderTimerRef.current);
      recorderTimerRef.current = null;
    }
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      try {
        mr.onstop = null;
        mr.stop();
      } catch { /* noop */ }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  };

  const startRecording = async () => {
    setRecordingError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '');
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recorderTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (e) {
      console.error('Mic access failed', e);
      setRecordingError(t('chat_voice_error'));
    }
  };

  const finishRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === 'inactive') return;
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
      const duration = recordingSeconds || 1;
      sendVoice(blob, duration);
      setIsRecording(false);
      setRecordingSeconds(0);
      if (recorderTimerRef.current) {
        clearInterval(recorderTimerRef.current);
        recorderTimerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      mediaRecorderRef.current = null;
      chunksRef.current = [];
    };
    mr.stop();
  };

  const renderMessageBody = (msg: Message) => {
    switch (msg.message_type) {
      case 'image':
        return (
          <div className={styles.imageMessage}>
            {msg.imageUrl ? (
              <ProtectedImage
                src={mediaUrl(msg.imageUrl) || ''}
                fallbackSrc={msg.imageUrl}
                alt="Shared image"
                className={styles.sharedImage}
              />
            ) : (
              <span className={styles.mediaPending}>{t('chat_sending_image')}</span>
            )}
          </div>
        );
      case 'voice':
        return msg.audioUrl ? (
          <div className={styles.voiceMessage}>
            <button
              type="button"
              className={styles.voicePlayBtn}
              onClick={() => togglePlay(msg.audioUrl!)}
              aria-label={playingUrl === msg.audioUrl ? 'Pause' : 'Play'}
            >
              {playingUrl === msg.audioUrl ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <span className={styles.voiceLabel}>{t('chat_voice_sent')}</span>
            {msg.audioDurationSeconds != null && (
              <span className={styles.voiceDuration}>{Math.round(msg.audioDurationSeconds)}s</span>
            )}
          </div>
        ) : (
          <span className={styles.mediaPending}>{t('chat_sending_voice')}</span>
        );
      case 'listing':
        return msg.listing ? (
          <div className={styles.listingCard}>
            <div className={styles.listingThumb}>
              {msg.listing.photo_url ? (
                <ProtectedImage
                  src={mediaUrl(msg.listing.photo_url) || ''}
                  fallbackSrc={msg.listing.photo_url}
                  alt={msg.listing.title}
                  className={styles.listingImg}
                />
              ) : (
                <div className={styles.listingThumbFallback}>
                  <Building2 size={22} />
                </div>
              )}
            </div>
            <div className={styles.listingInfo}>
              <div className={styles.listingTitle}>{msg.listing.title}</div>
              <div className={styles.listingPrice}>
                {t('chat_listing_price').replace('{currency}', msg.listing.currency || '£').replace('{price}', String(msg.listing.price))}
              </div>
              {msg.listing.location && (
                <div className={styles.listingMeta}>{msg.listing.location}</div>
              )}
            </div>
          </div>
        ) : (
          <span className={styles.mediaPending}>{t('chat_sending_listing')}</span>
        );
      default:
        return <span>{msg.text}</span>;
    }
  };

  const formatRecording = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessage(message);
    setMessage('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeChat}
          />
          <motion.div
            className={styles.panel}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className={styles.header}>
              <div className={styles.agentInfo}>
                {activeConversation ? (
                  <>
                    <ProtectedImage
                      src={(activeConversation.contact.avatarUrl ? mediaUrl(activeConversation.contact.avatarUrl) : '') || ''}
                      fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(activeConversation.contact.name || 'User')}&background=0F172A&color=fff&size=128&bold=true`}
                      alt={activeConversation.contact.name || t('chat_user')}
                      className={styles.avatar}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <h3 className={styles.agentName}>{activeConversation.contact.name}</h3>
                      <div className={styles.status} style={{ color: isOnline(activeConversation.contact.lastSeenAt) ? 'var(--success)' : 'var(--text-muted)' }}>
                        <span className={styles.statusDot} style={{
                          background: isOnline(activeConversation.contact.lastSeenAt) ? 'var(--success)' : 'var(--text-muted)',
                          boxShadow: isOnline(activeConversation.contact.lastSeenAt) ? '0 0 0 2px var(--bg-surface), 0 0 6px var(--success)' : 'none'
                        }} />
                        {getLocalizedLastSeenText(activeConversation.contact.lastSeenAt)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-surface)' }} />
                    <h3 className={styles.agentName}>{t('chat_connecting')}</h3>
                  </div>
                )}
              </div>
              <button onClick={closeChat} className={styles.closeBtn} aria-label="Close chat">
                <X size={20} />
              </button>
            </div>

            <div className={styles.chatArea}>
              {isLoadingMessages && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '28px', height: '28px', border: '3px solid var(--border)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: 'var(--text-sm)' }}>{t('chat_loading_messages')}</span>
                </div>
              )}
              {!isLoadingMessages && !activeConversation && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-4)' }}>
                  {t('chat_error_load')}
                </div>
              )}
              {!isLoadingMessages && activeConversation && activeConversation.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`${styles.message} ${msg.sender === 'user' ? styles.messageSent : styles.messageReceived}`}
                >
                  {renderMessageBody(msg)}
                  <div style={{ fontSize: 'var(--text-xs)', opacity: 0.7, marginTop: 'var(--space-1)', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {chatError && (
              <div style={{
                backgroundColor: 'var(--danger-muted)',
                color: 'var(--danger)',
                padding: 'var(--space-3)',
                fontSize: 'var(--text-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--danger-border)',
                margin: '0 var(--space-4)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <span>{chatError}</span>
                <button onClick={clearChatError} style={{ color: 'var(--danger)', cursor: 'pointer', background: 'none', border: 'none' }}>
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Image preview bar */}
            {imagePreview && (
              <div className={styles.previewBar}>
                <ProtectedImage
                  src={imagePreview}
                  fallbackSrc={imagePreview}
                  alt="Preview"
                  className={styles.previewImage}
                />
                <div className={styles.previewActions}>
                  <button type="button" onClick={handleSendImage} className={styles.previewSendBtn} aria-label={t('chat_send')}>
                    <Send size={16} />
                  </button>
                  <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); }} className={styles.previewCancelBtn} aria-label={t('chat_voice_cancel')}>
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Voice recording bar */}
            {isRecording && (
              <div className={styles.recordingBar}>
                <span className={styles.recordingDot} />
                <span className={styles.recordingLabel}>{t('chat_voice_recording')} {formatRecording(recordingSeconds)}</span>
                <button type="button" onClick={finishRecording} className={styles.previewSendBtn} aria-label={t('chat_voice_send')}>
                  <Send size={16} />
                </button>
                <button type="button" onClick={stopRecording} className={styles.previewCancelBtn} aria-label={t('chat_voice_cancel')}>
                  <Square size={14} />
                </button>
              </div>
            )}
            {recordingError && (
              <div className={styles.recordingError}>{recordingError}</div>
            )}

            <form onSubmit={handleSend} className={styles.inputArea}>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImagePick}
              />
              <button
                type="button"
                className={styles.toolBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={!activeConversation}
                aria-label={t('chat_attach_image')}
                title={t('chat_attach_image')}
              >
                <Paperclip size={18} />
              </button>
              <button
                type="button"
                className={styles.toolBtn}
                onClick={() => setShowListingPicker(true)}
                disabled={!activeConversation}
                aria-label={t('chat_send_listing')}
                title={t('chat_send_listing')}
              >
                <Building2 size={18} />
              </button>
              <input
                type="text"
                className={styles.input}
                placeholder={activeConversation ? t('chat_type_message') : t('chat_placeholder_connecting')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!activeConversation}
              />
              {isRecording ? (
                <button type="button" className={styles.sendBtn} onClick={finishRecording} aria-label={t('chat_voice_send')} style={{ background: 'var(--danger)' }}>
                  <Square size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={startRecording}
                  disabled={!activeConversation}
                  aria-label={t('chat_record_voice')}
                  title={t('chat_record_voice')}
                >
                  <Mic size={18} />
                </button>
              )}
              <button type="submit" className={styles.sendBtn} disabled={!message.trim() || !activeConversation} aria-label="Send message">
                <Send size={18} />
              </button>
            </form>

            {/* Listing picker overlay */}
            <AnimatePresence>
              {showListingPicker && (
                <motion.div
                  className={styles.listingPicker}
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                >
                  <div className={styles.listingPickerHeader}>
                    <div>
                      <h4 className={styles.listingPickerTitle}>{t('chat_pick_listing_title')}</h4>
                      <p className={styles.listingPickerSub}>{t('chat_pick_listing_sub')}</p>
                    </div>
                    <button className={styles.closeBtn} onClick={() => setShowListingPicker(false)} aria-label="Close">
                      <X size={18} />
                    </button>
                  </div>
                  <div className={styles.listingSearchRow}>
                    <Search size={16} style={{ color: 'var(--text-muted)' }} />
                    <input
                      className={styles.listingSearchInput}
                      placeholder={t('chat_pick_listing_search')}
                      value={listingSearch}
                      onChange={(e) => setListingSearch(e.target.value)}
                    />
                  </div>
                  <div className={styles.listingPickerList}>
                    {listingsLoading ? (
                      <div className={styles.listingPickerEmpty}>{t('chat_pick_listing_loading')}</div>
                    ) : listings.length === 0 ? (
                      <div className={styles.listingPickerEmpty}>{t('chat_pick_listing_empty')}</div>
                    ) : (
                      listings.map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          className={styles.listingOption}
                          onClick={() => handleSendListing(l.id)}
                        >
                          <div className={styles.listingOptionThumb}>
                            {l.photo_url ? (
                              <ProtectedImage
                                src={mediaUrl(l.photo_url) || ''}
                                fallbackSrc={l.photo_url}
                                alt={l.title}
                                className={styles.listingOptionImg}
                              />
                            ) : (
                              <div className={styles.listingThumbFallback}>
                                <Building2 size={18} />
                              </div>
                            )}
                          </div>
                          <div className={styles.listingOptionInfo}>
                            <div className={styles.listingOptionTitle}>{l.title}</div>
                            <div className={styles.listingOptionPrice}>
                              {t('chat_listing_price').replace('{currency}', l.currency).replace('{price}', String(l.price))}
                            </div>
                            <div className={styles.listingOptionMeta}>{l.location}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
