'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Paperclip, Mic, Square, Play, Pause } from 'lucide-react';
import { useChatStore, type Message } from '@/lib/store/useChatStore';
import { mediaUrl } from '@/lib/api';

import styles from './ChatPanel.module.css';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import { BrandedAvatar } from '@/components/ui/BrandedAvatar';
import { PropertyLinkCard } from '@/components/chat/PropertyLinkCard';
import { isOnline, lastSeenText } from '@/lib/timeAgo';
import { useLanguageStore } from '@/lib/store/useLanguageStore';

export function ChatPanel() {
  const {
    isOpen, activeAgentId, activeConversationId, conversations, closeChat,
    sendMessage, sendImage, sendVoice,
    chatError, clearChatError, isLoadingMessages,
  } = useChatStore();
  const { t } = useLanguageStore();
  const [message, setMessage] = useState('');
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userAtBottom, setUserAtBottom] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [showOriginalFor, setShowOriginalFor] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recorderTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeConversation = activeAgentId ? conversations[activeAgentId] : null;

  // Auto-scroll to bottom when messages change, but only if the user is already
  // near the bottom (so polling every 5s doesn't yank the user up while reading).
  useEffect(() => {
    if (!userAtBottom) return;
    const el = chatAreaRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [activeConversation?.messages, activeAgentId, isLoadingMessages, userAtBottom]);

  // Reset scroll tracking when switching conversations
  const [prevAgentId, setPrevAgentId] = useState(activeAgentId);
  if (prevAgentId !== activeAgentId) {
    setPrevAgentId(activeAgentId);
    setUserAtBottom(true);
    setShowOriginalFor(null);
  }

  // Reset transient state when chat closes
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (prevOpen !== isOpen) {
    setPrevOpen(isOpen);
    if (!isOpen) {
      setMessage('');
      setImagePreview(null);
      setImageFile(null);
      setPlayingUrl(null);
      setIsRecording(false);
      setRecordingSeconds(0);
      setRecordingError(null);
    }
  }

  // Stop any in-flight media/recording when the chat closes
  useEffect(() => {
    if (isOpen) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
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
  }, [isOpen]);

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
                alt={t('chat_shared_image')}
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
              aria-label={playingUrl === msg.audioUrl ? t('chat_pause') : t('chat_play')}
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
      default:
        const showOriginal = showOriginalFor === msg.id && !!msg.originalText && msg.originalText !== msg.text;
        return (
          <span className={styles.textMessage}>
            {showOriginal ? msg.originalText : msg.text}
            <PropertyLinkCard text={showOriginal ? msg.originalText : msg.text} />
            {msg.wasTranslated && msg.originalText && msg.originalText !== msg.text && (
              <button
                type="button"
                className={styles.translatedToggle}
                onClick={() => setShowOriginalFor(showOriginal ? null : msg.id)}
              >
                {showOriginal ? t('chat_show_translation') : `${t('chat_translated')} · ${t('chat_show_original')}`}
              </button>
            )}
          </span>
        );
    }
  };

  const formatRecording = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isOpen) return null;

  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setUserAtBottom(distanceFromBottom < 80);
  };

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
                    <BrandedAvatar
                      src={activeConversation.contact.avatarUrl ? mediaUrl(activeConversation.contact.avatarUrl) : null}
                      name={activeConversation.contact.name || t('chat_user')}
                      size={40}
                      className={`${styles.avatar} ${styles.avatarRound}`}
                    />
                    <div>
                      <h3 className={styles.agentName}>{activeConversation.contact.name}</h3>
                      <div className={`${styles.status} ${isOnline(activeConversation.contact.lastSeenAt) ? styles.statusOnline : styles.statusOffline}`}>
                        <span className={`${styles.statusDot} ${isOnline(activeConversation.contact.lastSeenAt) ? styles.statusDotOnline : styles.statusDotOffline}`} />
                        {(() => {
                          const ls = lastSeenText(activeConversation.contact.lastSeenAt);
                          return ls.params
                            ? t(ls.key).replace('{count}', ls.params.count ?? '')
                            : t(ls.key);
                        })()}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={styles.connectingRow}>
                    <div className={styles.connectingAvatar} />
                    <h3 className={styles.agentName}>{t('chat_connecting')}</h3>
                  </div>
                )}
              </div>
              <button onClick={closeChat} className={styles.closeBtn} aria-label={t('chat_close_chat')}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.chatArea} onScroll={handleChatScroll} ref={chatAreaRef}>
              {isLoadingMessages && (
                <div className={styles.loadingMessages}>
                  <div className={styles.loadingSpinner} />
                  <span className={styles.loadingText}>{t('chat_loading_messages')}</span>
                </div>
              )}
              {!isLoadingMessages && !activeConversation && (
                <div className={styles.loadError}>
                  {t('chat_error_load')}
                </div>
              )}
              {!isLoadingMessages && activeConversation && activeConversation.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`${styles.message} ${msg.sender === 'user' ? styles.messageSent : styles.messageReceived}`}
                >
                  {renderMessageBody(msg)}
                  <div className={`${styles.timestamp} ${msg.sender === 'user' ? styles.timestampSent : styles.timestampReceived}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>

            {chatError && (
              <div className={styles.chatErrorBar}>
                <span>{chatError}</span>
                <button onClick={clearChatError} className={styles.chatErrorClose}>
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
                  alt={t('chat_preview')}
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
                className={styles.hiddenInput}
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
              <input
                type="text"
                className={styles.input}
                placeholder={activeConversation ? t('chat_type_message') : t('chat_placeholder_connecting')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!activeConversation}
              />
              {isRecording ? (
                <button type="button" className={`${styles.sendBtn} ${styles.sendBtnDanger}`} onClick={finishRecording} aria-label={t('chat_voice_send')}>
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
              <button type="submit" className={styles.sendBtn} disabled={!activeConversation} aria-label={t('chat_send_message')}>
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
