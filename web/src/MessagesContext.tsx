import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';

interface Message {
  _id: string;
  fromUser: any;
  toUser: any;
  message: string;
  createdAt: string;
  conversationId?: string;
}

interface MessagesContextType {
  wsConnected: boolean;
  sendMessage: (msg: Omit<Message, '_id' | 'createdAt'> & { conversationId?: string }) => void;
  subscribe: (handler: (msg: Message) => void) => () => void;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export const useMessages = () => {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages must be used within a MessagesProvider');
  return ctx;
};

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const subscribers = useRef<((msg: Message) => void)[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000/ws');
    wsRef.current = ws;
    ws.onopen = () => {
      setWsConnected(true);
      // Send auth message with userId
      const token = localStorage.getItem('token');
      let userId = '';
      if (token) {
        try {
          const decoded: any = JSON.parse(atob(token.split('.')[1]));
          userId = decoded.userId || decoded.id || '';
        } catch {}
      }
      if (userId) {
        ws.send(JSON.stringify({ type: 'auth', userId }));
      }
    };
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          const msg: Message = {
            _id: data.id,
            fromUser: data.fromUser,
            toUser: data.toUser,
            message: data.message,
            createdAt: new Date().toISOString(),
            conversationId: data.conversationId,
          };
          subscribers.current.forEach(fn => fn(msg));
        }
      } catch {}
    };
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, []);

  const sendMessage = (msg: Omit<Message, '_id' | 'createdAt'> & { conversationId?: string }) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'message',
          id: `msg-${Date.now()}`,
          ...msg,
        })
      );
    }
  };

  const subscribe = (handler: (msg: Message) => void) => {
    subscribers.current.push(handler);
    return () => {
      subscribers.current = subscribers.current.filter(fn => fn !== handler);
    };
  };

  return (
    <MessagesContext.Provider value={{ wsConnected, sendMessage, subscribe }}>
      {children}
    </MessagesContext.Provider>
  );
};

// Add conversations context
interface ConversationsContextType {
  conversations: any[];
  setConversations: React.Dispatch<React.SetStateAction<any[]>>;
  unreadCount: number;
  resetUnread: () => void;
}
const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);
export const useConversations = () => {
  const ctx = useContext(ConversationsContext);
  if (!ctx) throw new Error('useConversations must be used within a ConversationsProvider');
  return ctx;
};

export const ConversationsProvider = ({ children }: { children: ReactNode }) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { subscribe } = useMessages();

  // Fetch existing conversations/messages on mount
  useEffect(() => {
    let mounted = true;
    import('./api').then(({ getReceivedMessages }) => {
      getReceivedMessages().then((data: any) => {
        if (!mounted) return;
        const token = localStorage.getItem('token');
        let currentUserId = '';
        if (token) {
          try {
            const decoded: any = JSON.parse(atob(token.split('.')[1]));
            currentUserId = decoded.userId || decoded.id || '';
          } catch {}
        }
        const convMap: { [key: string]: any } = {};
        (data.messages || data).forEach((msg: any) => {
          const convId = msg.conversationId || msg._id || msg.listing?._id || msg.listingId;
          if (!convId) return;
          let otherUser = (msg.fromUser && (msg.fromUser._id || msg.fromUser.id || msg.fromUser)) === currentUserId ? msg.toUser : msg.fromUser;
          if (!convMap[convId]) {
            convMap[convId] = {
              _id: convId,
              message: msg.message,
              updatedAt: msg.createdAt,
              unreadCount: msg.unreadCount, // use backend value directly
              thread: [msg],
              fromUser: otherUser,
              listing: msg.listing,
            };
          } else {
            convMap[convId].thread.push(msg);
            if (new Date(msg.createdAt) > new Date(convMap[convId].updatedAt)) {
              convMap[convId].message = msg.message;
              convMap[convId].updatedAt = msg.createdAt;
            }
          }
        });
        const convArr = Object.values(convMap).sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setConversations(convArr);
        setUnreadCount(convArr.reduce((acc: number, conv: any) => acc + (conv.unreadCount || 0), 0));
      }).catch(() => {
        setConversations([]);
        setUnreadCount(0);
      });
    });
    return () => { mounted = false; };
  }, []);

  // Subscribe to new messages globally
  useEffect(() => {
    // Get current user ID once for this effect
    const token = localStorage.getItem('token');
    let currentUserId = '';
    if (token) {
      try {
        const decoded: any = JSON.parse(atob(token.split('.')[1]));
        currentUserId = decoded.userId || decoded.id || '';
      } catch {}
    }
    const unsub = subscribe((msg: any) => {
      // Only increment unread if the logged-in user is the recipient
      const isRecipient = (msg.toUser?._id || msg.toUser?.id || msg.toUser) === currentUserId;
      setConversations(prev => {
        const idx = prev.findIndex(conv => conv._id === msg.conversationId);
        if (idx !== -1) {
          return prev.map((conv, i) =>
            i === idx
              ? { ...conv, message: msg.message, updatedAt: msg.createdAt, unreadCount: isRecipient ? (conv.unreadCount || 0) + 1 : conv.unreadCount, thread: conv.thread ? [...conv.thread, msg] : [msg] }
              : conv
          );
        } else {
          let otherUser = (msg.fromUser && (msg.fromUser._id || msg.fromUser.id || msg.fromUser)) === currentUserId ? msg.toUser : msg.fromUser;
          return [
            {
              _id: msg.conversationId,
              message: msg.message,
              updatedAt: msg.createdAt,
              unreadCount: isRecipient ? 1 : 0,
              thread: [msg],
              fromUser: otherUser,
              listing: msg.listing
            },
            ...prev
          ];
        }
      });
    });
    return unsub;
  }, [subscribe]);

  // Update unread count whenever conversations change
  useEffect(() => {
    setUnreadCount(conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0));
  }, [conversations]);

  // Function to reset unread count (mark all as read)
  const resetUnread = useCallback(() => {
    setConversations(prev => prev.map((conv: any) => ({ ...conv, unreadCount: 0 })));
  }, [setConversations]);

  return (
    <ConversationsContext.Provider value={{ conversations, setConversations, unreadCount, resetUnread }}>
      {children}
    </ConversationsContext.Provider>
  );
};
