import { create } from 'zustand';
import { apiRequest } from '../api';
import { useAuthStore } from './useAuthStore';

export interface Agent {
  id: string;
  name: string;
  avatarUrl: string;
  lastSeenAt?: string | null;
}

export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'agent';
  timestamp: number;
}

export interface Conversation {
  conversation_id: number;
  contact: Agent;
  messages: Message[];
  unreadCount: number;
}

// Raw shapes returned by the FastAPI backend
interface RawApiUser {
  id: number;
  name: string;
  avatar_url: string;
  last_seen_at: string | null;
}

interface RawApiLastMessage {
  id: number;
  text: string;
  sender_id: number;
  created_at: string;
}

interface RawApiConversation {
  id: number;
  agent: RawApiUser;
  renter: RawApiUser;
  last_message: RawApiLastMessage | null;
  unread_count: number;
}

interface RawApiMessage {
  id: number;
  text: string;
  sender_id: number;
  created_at: string;
}

interface ChatState {
  isOpen: boolean;
  activeConversationId: number | null;
  activeAgentId: string | null;
  activeListingId: number | null;
  conversations: Record<string, Conversation>;
  notification: { title: string; body: string } | null;
  chatError: string | null;
  isLoadingMessages: boolean;
  
  openChat: (agent: Agent, listingId?: number) => void;
  closeChat: () => void;
  sendMessage: (text: string) => Promise<void>;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: number) => Promise<void>;
  clearNotification: () => void;
  clearChatError: () => void;
  markAsRead: (agentId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  isOpen: false,
  activeConversationId: null,
  activeAgentId: null,
  activeListingId: null,
  conversations: {},
  notification: null,
  chatError: null,
  isLoadingMessages: false,

  fetchConversations: async () => {
    try {
      const data = await apiRequest('/messages/conversations');
      const currentUser = useAuthStore.getState().user;

      set((state) => {
        const existing = state.conversations;
        const convs: Record<string, Conversation> = {};

        data.forEach((c: RawApiConversation) => {
          const contactUser = (currentUser && String(currentUser.id) === String(c.renter.id)) ? c.agent : c.renter;
          const key = contactUser.id.toString();
          const prev = existing[key];

          // If we already have a full message history loaded (more than 1 message),
          // preserve it — only update metadata like unreadCount and contact info.
          const messages = (prev && prev.messages.length > 1)
            ? prev.messages
            : c.last_message ? [{
                id: c.last_message.id,
                text: c.last_message.text,
                sender: (currentUser && c.last_message.sender_id.toString() === currentUser.id.toString()) ? 'user' as const : 'agent' as const,
                timestamp: new Date(c.last_message.created_at.endsWith('Z') ? c.last_message.created_at : c.last_message.created_at + 'Z').getTime()
              }] : [];

          convs[key] = {
            conversation_id: c.id,
            contact: {
              id: key,
              name: contactUser.name,
              avatarUrl: contactUser.avatar_url,
              lastSeenAt: contactUser.last_seen_at
            },
            messages,
            unreadCount: c.unread_count
          };
        });

        return { conversations: convs };
      });
    } catch (e) {
      console.error('Failed to fetch conversations', e);

    }
  },

  fetchMessages: async (conversationId: number) => {
    try {
      const msgs = await apiRequest(`/messages/conversations/${conversationId}/messages`);
      const currentUser = useAuthStore.getState().user;

      set((state) => {
        const agentId = state.activeAgentId;
        if (!agentId) return state;

        const convs = { ...state.conversations };
        if (convs[agentId]) {
          // Map all server messages
          const serverMessages: Message[] = msgs.map((m: RawApiMessage) => ({
            id: m.id,
            text: m.text,
            sender: (currentUser && m.sender_id.toString() === currentUser.id.toString()) ? 'user' as const : 'agent' as const,
            timestamp: new Date(m.created_at.endsWith('Z') ? m.created_at : m.created_at + 'Z').getTime()
          }));

          const serverIds = new Set(serverMessages.map(m => m.id));

          // Keep only optimistic (temp) messages that haven't been confirmed by server yet
          const pendingTempMessages = (convs[agentId].messages || []).filter(
            m => m.id > 10_000_000_000 && !serverIds.has(m.id)
          );

          convs[agentId] = {
            ...convs[agentId],
            messages: [...serverMessages, ...pendingTempMessages]
          };
        }
        return { conversations: convs, isLoadingMessages: false };
      });
    } catch (e) {
      console.error('Failed to fetch messages', e);
      set({ isLoadingMessages: false });
    }
  },

  openChat: async (agent, listingId) => {
    set({ isOpen: true, activeAgentId: agent.id, activeListingId: listingId || null, isLoadingMessages: true });
    
    // Trigger push notification subscription
    if (typeof window !== 'undefined') {
      import('@/lib/pushNotifications').then(m => m.initPushNotifications()).catch(() => {});
    }
    
    // Check if we already have the conversation in the store
    const existingConv = get().conversations[agent.id];
    if (existingConv && existingConv.conversation_id) {
      set({ activeConversationId: existingConv.conversation_id });
      // Await full message history before marking as loaded
      await get().fetchMessages(existingConv.conversation_id);
      return;
    }
    
    // Start or get conversation from the server
    try {
      const body: Record<string, number> = {};
      if (listingId) {
        body.listing_id = listingId;
      } else {
        body.agent_id = parseInt(agent.id, 10);
      }
      
      const conv = await apiRequest('/messages/conversations', {
        method: 'POST',
        body
      });
      set({ activeConversationId: conv.id });
      await get().fetchConversations();
      await get().fetchMessages(conv.id);
    } catch (e: unknown) {
      console.error('Failed to open chat:', e);
      set({ isLoadingMessages: false });
    }
  },

  closeChat: () => set({ isOpen: false, activeAgentId: null, activeConversationId: null, activeListingId: null, chatError: null }),

  markAsRead: (agentId) => {
    set((state) => {
      const convs = { ...state.conversations };
      if (convs[agentId]) {
        convs[agentId] = { ...convs[agentId], unreadCount: 0 };
      }
      return { conversations: convs };
    });
  },

  clearNotification: () => set({ notification: null }),
  
  clearChatError: () => set({ chatError: null }),

  sendMessage: async (text) => {
    const { activeConversationId, activeAgentId } = get();
    if (!activeConversationId || !activeAgentId) return;

    set({ chatError: null });

    const tempId = Date.now();
    const newMsg: Message = { id: tempId, text, sender: 'user', timestamp: tempId };

    set((state) => {
      const conv = state.conversations[activeAgentId];
      if (!conv) return state;
      return {
        conversations: {
          ...state.conversations,
          [activeAgentId]: {
            ...conv,
            messages: [...(conv.messages || []), newMsg]
          }
        }
      };
    });

    try {
      const formData = new FormData();
      formData.append('body', text);
      await apiRequest(`/messages/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        formData: formData
      });

      // Fetch canonical server state — this removes the temp message and adds
      // the real one in one atomic update, preventing the double-message race
      // that occurred when the polling interval also called fetchMessages.
      await get().fetchMessages(activeConversationId);
    } catch (e: unknown) {
      // Remove temp message on failure
      set((state) => {
        const conv = state.conversations[activeAgentId];
        if (!conv) return state;
        return {
          conversations: {
            ...state.conversations,
            [activeAgentId]: {
              ...conv,
              messages: conv.messages.filter(m => m.id !== tempId)
            }
          }
        };
      });
      console.error('Failed to send message', e);
      if (typeof window !== 'undefined') {
        const err = e as { detail?: unknown };
        if (err?.detail) {
          set({ chatError: typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail) });
        } else {
          set({ chatError: 'Failed to send message. Please try again.' });
        }
      }
    }
  }
}));
