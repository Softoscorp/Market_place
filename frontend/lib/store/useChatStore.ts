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

interface ChatState {
  isOpen: boolean;
  activeConversationId: number | null;
  activeAgentId: string | null;
  activeListingId: number | null;
  conversations: Record<string, Conversation>;
  notification: any | null;
  
  openChat: (agent: Agent, listingId?: number) => void;
  closeChat: () => void;
  sendMessage: (text: string) => Promise<void>;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: number) => Promise<void>;
  clearNotification: () => void;
  markAsRead: (agentId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  isOpen: false,
  activeConversationId: null,
  activeAgentId: null,
  activeListingId: null,
  conversations: {},
  notification: null,

  fetchConversations: async () => {
    try {
      const data = await apiRequest('/messages/conversations');
      const currentUser = useAuthStore.getState().user;
      const convs: Record<string, Conversation> = {};
      
      data.forEach((c: any) => {
        // Map to old shape dynamically based on who the current user is
        const contactUser = (currentUser && String(currentUser.id) === String(c.renter.id)) ? c.agent : c.renter;
        
        convs[contactUser.id.toString()] = {
          conversation_id: c.id,
          contact: {
            id: contactUser.id.toString(),
            name: contactUser.name,
            avatarUrl: contactUser.avatar_url,
            lastSeenAt: contactUser.last_seen_at
          },
          messages: c.last_message ? [{ 
            id: c.last_message.id, 
            text: c.last_message.text, 
            sender: (currentUser && c.last_message.sender_id.toString() === currentUser.id.toString()) ? 'user' : 'agent', 
            timestamp: new Date(c.last_message.created_at.endsWith('Z') ? c.last_message.created_at : c.last_message.created_at + 'Z').getTime() 
          }] : [],
          unreadCount: c.unread_count
        };
      });
      set({ conversations: convs });
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
          const serverMessages = msgs.map((m: any) => ({
            id: m.id,
            text: m.text,
            sender: (currentUser && m.sender_id.toString() === currentUser.id.toString()) ? 'user' : 'agent',
            timestamp: new Date(m.created_at.endsWith('Z') ? m.created_at : m.created_at + 'Z').getTime()
          }));
          
          const tempMessages = (convs[agentId].messages || []).filter(m => m.id > 10000000000);
          convs[agentId].messages = [...serverMessages, ...tempMessages];
        }
        return { conversations: convs };
      });
    } catch (e) {
      console.error('Failed to fetch messages', e);
    }
  },

  openChat: async (agent, listingId) => {
    set({ isOpen: true, activeAgentId: agent.id, activeListingId: listingId || null });
    
    // Trigger push notification subscription synchronously in the click handler
    if (typeof window !== 'undefined') {
      import('@/lib/push').then(m => m.subscribeToPushNotifications());
    }
    
    // Check if we already have the conversation in the store
    const existingConv = get().conversations[agent.id];
    if (existingConv && existingConv.conversation_id) {
      set({ activeConversationId: existingConv.conversation_id });
      // Fetch all messages asynchronously (don't await so UI is responsive)
      get().fetchMessages(existingConv.conversation_id);
      return;
    }
    
    // Attempt to start or get conversation from the server
    try {
      const body: any = {};
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
    } catch (e: any) {
      console.error('Failed to open chat:', e);
    }
  },

  closeChat: () => set({ isOpen: false, activeAgentId: null, activeConversationId: null, activeListingId: null }),

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

  sendMessage: async (text) => {
    const { activeConversationId, activeAgentId, conversations } = get();
    if (!activeConversationId || !activeAgentId) return;

    const timestamp = Date.now();
    const newMsg: Message = { id: timestamp, text, sender: 'user', timestamp };

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
      const savedMsg = await apiRequest(`/messages/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        formData: formData
      });
      
      set((state) => {
        const conv = state.conversations[activeAgentId];
        if (!conv) return state;
        
        const realMsg = {
          id: savedMsg.id,
          text: savedMsg.text,
          sender: 'user' as const,
          timestamp: new Date(savedMsg.created_at.endsWith('Z') ? savedMsg.created_at : savedMsg.created_at + 'Z').getTime()
        };
        
        return {
          conversations: {
            ...state.conversations,
            [activeAgentId]: {
              ...conv,
              messages: conv.messages.map(m => m.id === timestamp ? realMsg : m)
            }
          }
        };
      });
    } catch (e: any) {
      // Remove temp message if failed
      set((state) => {
        const conv = state.conversations[activeAgentId];
        if (!conv) return state;
        return {
          conversations: {
            ...state.conversations,
            [activeAgentId]: {
              ...conv,
              messages: conv.messages.filter(m => m.id !== timestamp)
            }
          }
        };
      });
      console.error('Failed to send message', e);
      if (typeof window !== 'undefined' && e?.detail) {
        alert(typeof e.detail === 'string' ? e.detail : JSON.stringify(e.detail));
      }
    }
  }
}));
