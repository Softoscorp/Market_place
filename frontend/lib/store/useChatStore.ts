import { create } from 'zustand';
import { apiRequest } from '../api';

export interface Agent {
  id: string;
  name: string;
  avatarUrl: string;
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
      const convs: Record<string, Conversation> = {};
      
      data.forEach((c: any) => {
        // Map to old shape
        convs[c.agent.id.toString()] = {
          conversation_id: c.id,
          contact: {
            id: c.agent.id.toString(),
            name: c.agent.name,
            avatarUrl: c.agent.avatar_url
          },
          messages: c.last_message ? [{ 
            id: c.last_message.id, 
            text: c.last_message.text, 
            sender: c.last_message.sender_id === c.agent.id ? 'agent' : 'user', 
            timestamp: new Date(c.last_message.created_at).getTime() 
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
      
      set((state) => {
        const agentId = state.activeAgentId;
        if (!agentId) return state;

        const convs = { ...state.conversations };
        if (convs[agentId]) {
          convs[agentId].messages = msgs.map((m: any) => ({
            id: m.id,
            text: m.text,
            sender: m.sender_id.toString() === agentId ? 'agent' : 'user',
            timestamp: new Date(m.created_at).getTime()
          }));
        }
        return { conversations: convs };
      });
    } catch (e) {
      console.error('Failed to fetch messages', e);
    }
  },

  openChat: async (agent, listingId) => {
    set({ isOpen: true, activeAgentId: agent.id, activeListingId: listingId || null });
    
    // Attempt to start or get conversation
    if (listingId) {
      try {
        const conv = await apiRequest('/messages/conversations', {
          method: 'POST',
          body: {
            listing_id: listingId,
            message: `Hi there! I'm interested in your property.`
          }
        });
        set({ activeConversationId: conv.id });
        await get().fetchMessages(conv.id);
      } catch (e: any) {
        // If message is just "getting", maybe it errors because conversation exists
        // Just fetch messages if it failed
      }
    }
    
    await get().fetchConversations();
    const convInfo = get().conversations[agent.id];
    if (convInfo?.conversation_id) {
      set({ activeConversationId: convInfo.conversation_id });
      await get().fetchMessages(convInfo.conversation_id);
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
      await apiRequest(`/messages/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        formData: formData
      });
      // Wait a moment then refresh
      setTimeout(() => get().fetchMessages(activeConversationId), 500);
    } catch (e) {
      console.error('Failed to send message', e);
    }
  }
}));
