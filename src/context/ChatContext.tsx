/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

import type { ChatMessage } from '../services/chat.service';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.29.26:5555';

interface ChatContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (roomId: string, message: string) => void;
  unreadRooms: string[];
  markRoomAsRead: (roomId: string) => void;
}

const ChatContext = createContext<ChatContextType>({
  socket: null,
  isConnected: false,
  sendMessage: () => {},
  unreadRooms: [],
  markRoomAsRead: () => {},
});

export const useChatContext = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { token, isAuthenticated, student } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadRooms, setUnreadRooms] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const markRoomAsRead = useCallback((roomId: string) => {
    setUnreadRooms(prev => prev.filter(id => id !== roomId));
  }, []);

  const sendMessage = useCallback((roomId: string, message: string) => {
    if (socket) {
      socket.emit('send_message', { roomId, message });
    }
  }, [socket]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const newSocket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setSocket(newSocket);
    });
    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setSocket(null);
    });
    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setIsConnected(false);
      setSocket(null);
    });

    const handleMessage = (data: { roomId: string; message: ChatMessage }) => {
      const sender = data.message.senderId;
      const senderId = typeof sender === 'object' ? sender?._id : sender;
      
      // If the message is from someone else, mark this room as unread
      if (senderId && student?._id && senderId !== student._id) {
        setUnreadRooms(prev => {
          if (prev.includes(data.roomId)) return prev;
          return [...prev, data.roomId];
        });
      }
    };

    newSocket.on('new_message', handleMessage);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, token, student?._id]);

  return (
    <ChatContext.Provider value={{ socket, isConnected, sendMessage, unreadRooms, markRoomAsRead }}>
      {children}
    </ChatContext.Provider>
  );
};
