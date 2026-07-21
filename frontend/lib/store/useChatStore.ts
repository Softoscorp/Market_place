import { create } from 'zustand';

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
  contact: Agent;
  messages: Message[];
  unreadCount: number;
}

interface Notification {
  id: number;
  contactName: string;
  avatarUrl: string;
  text: string;
}

interface ChatState {
  isOpen: boolean;
  activeAgentId: string | null;
  conversations: Record<string, Conversation>;
  notification: Notification | null;
  
  openChat: (agent: Agent) => void;
  closeChat: () => void;
  sendMessage: (text: string) => void;
  clearNotification: () => void;
  markAsRead: (agentId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  isOpen: false,
  activeAgentId: null,
  conversations: {},
  notification: null,

  openChat: (agent) => {
    set((state) => {
      const convs = { ...state.conversations };
      // Initialize if not exists
      if (!convs[agent.id]) {
        convs[agent.id] = {
          contact: agent,
          messages: [{ id: Date.now(), text: `Hi there! I'm ${agent.name}. How can I help you today?`, sender: 'agent', timestamp: Date.now() }],
          unreadCount: 0
        };
      } else {
        // Mark as read when opening
        convs[agent.id] = { ...convs[agent.id], unreadCount: 0 };
      }
      
      return { 
        isOpen: true, 
        activeAgentId: agent.id,
        conversations: convs
      };
    });
  },

  closeChat: () => set({ isOpen: false, activeAgentId: null }),

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

  sendMessage: (text) => {
    const { activeAgentId, conversations } = get();
    if (!activeAgentId) return;

    const timestamp = Date.now();
    const newMsg: Message = { id: timestamp, text, sender: 'user', timestamp };

    set((state) => {
      const conv = state.conversations[activeAgentId];
      return {
        conversations: {
          ...state.conversations,
          [activeAgentId]: {
            ...conv,
            messages: [...conv.messages, newMsg]
          }
        }
      };
    });

    // Mock an automated reply after 2 seconds
    setTimeout(() => {
      const currentState = useChatStore.getState();
      const currentActiveId = currentState.activeAgentId;
      const isChatOpen = currentState.isOpen;
      
      const replyMsg: Message = { 
        id: Date.now(), 
        text: "Thanks for reaching out! I'm currently assisting another client, but I will get back to you shortly.", 
        sender: 'agent', 
        timestamp: Date.now() 
      };

      useChatStore.setState((state) => {
        const conv = state.conversations[activeAgentId];
        const isCurrentlyViewing = isChatOpen && currentActiveId === activeAgentId;
        
        return {
          conversations: {
            ...state.conversations,
            [activeAgentId]: {
              ...conv,
              messages: [...conv.messages, replyMsg],
              unreadCount: isCurrentlyViewing ? 0 : conv.unreadCount + 1
            }
          },
          // Trigger notification if chat is NOT open with this agent
          notification: !isCurrentlyViewing ? {
            id: Date.now(),
            contactName: conv.contact.name,
            avatarUrl: conv.contact.avatarUrl,
            text: replyMsg.text
          } : null
        };
      });
      
      // Auto-hide notification after 5s
      setTimeout(() => {
        useChatStore.getState().clearNotification();
      }, 5000);
      
    }, 2000);
  }
}));
