import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useChatRooms, useChatMessages, useCreateChatRoom, useSendChatMessage } from '../hooks/useChat';
import { useChatContext } from '../context/ChatContext';
import type { ChatMessage, ChatRoom } from '../services/chat.service';
import { MessageSquare, Send, Globe, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageChildVariants } from '../components/PageTransition';
import { getAvatarFallback } from '../utils/fallbacks';

export const ChatPage = () => {
  const { student } = useAuth();
  const { socket, unreadRooms, markRoomAsRead } = useChatContext();
  const isAdmin = student?.role === 'admin';
  const queryClient = useQueryClient();

  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelectRoom = (room: ChatRoom | null) => {
    setSelectedRoom(room);
    setRealtimeMessages([]);
    if (room?._id) {
      markRoomAsRead(room._id);
    }
  };

  useEffect(() => {
    if (selectedRoom?._id) {
      markRoomAsRead(selectedRoom._id);
    }
  }, [selectedRoom?._id, markRoomAsRead]);

  const { data: roomsRes, isLoading: roomsLoading } = useChatRooms();
  const { data: messagesRes, isLoading: messagesLoading } = useChatMessages(selectedRoom?._id || null);
  const createRoomMutation = useCreateChatRoom();
  const sendMessageMutation = useSendChatMessage();

  const rooms: ChatRoom[] = roomsRes?.data?.room_data || [];
  // Merge DB messages with realtime messages
  const allMessages = useMemo(() => {
    const dbMsgs = messagesRes?.data?.message_data || [];
    return [...dbMsgs, ...realtimeMessages.filter(
      rm => !dbMsgs.some((dm: ChatMessage) => dm._id === rm._id)
    )];
  }, [messagesRes?.data?.message_data, realtimeMessages]);

  const globalRoom = rooms.find(r => r.type === 'global');
  const personalRooms = rooms.filter(r => r.type === 'personal');

  // Listen for new messages via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data: { roomId: string; message: ChatMessage }) => {
      // Invalidate rooms to update lastMessage and re-order lists immediately
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });

      if (selectedRoom && data.roomId === selectedRoom._id) {
        setRealtimeMessages(prev => {
          if (prev.some(m => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
        queryClient.invalidateQueries({ queryKey: ['chat-messages', data.roomId] });
      }
    };

    socket.on('new_message', handleMessage);
    return () => { socket.off('new_message', handleMessage); };
  }, [socket, selectedRoom, queryClient]);

  // Listen for room_created events
  useEffect(() => {
    if (!socket) return;
    const handleRoomCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    };
    socket.on('room_created', handleRoomCreated);
    return () => { socket.off('room_created', handleRoomCreated); };
  }, [socket, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);



  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    const msg = messageInput.trim();
    setMessageInput('');

    try {
      await sendMessageMutation.mutateAsync({
        roomId: selectedRoom?._id,
        message: msg,
      });
    } catch {
      setMessageInput(msg);
    }

    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartPersonalChat = async () => {
    try {
      const res = await createRoomMutation.mutateAsync(undefined);
      const room = res?.data?.room;
      if (room) {
        handleSelectRoom(room);
      }
    } catch {
      // error toast
    }
  };

  const getSenderName = (sender: ChatMessage['senderId']) => {
    if (typeof sender === 'string') return 'Unknown';
    return sender.fullName || 'Unknown';
  };

  const getSenderRole = (sender: ChatMessage['senderId']) => {
    if (typeof sender === 'string') return 'user';
    return sender.role || 'user';
  };

  if (roomsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-brand-primary" size={24} />
      </div>
    );
  }

  return (
    <motion.div variants={pageChildVariants} className="flex flex-1 min-h-0 bg-white dark:bg-page-dark rounded-3xl border border-orange-100/30 dark:border-slate-800/50 overflow-hidden">
      
      {/* Left Panel - Room List */}
      <div className={`w-full sm:w-80 border-r border-orange-100/30 dark:border-slate-800/50 flex flex-col bg-slate-50/50 dark:bg-slate-900/30 ${selectedRoom ? 'hidden sm:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-orange-100/30 dark:border-slate-800/50">
          <h2 className="font-display font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
            <MessageSquare size={18} className="text-brand-primary" />
            Messages
          </h2>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          {/* Global Room */}
          {globalRoom && (
            <button
              onClick={() => handleSelectRoom(globalRoom)}
              className={`w-full p-4 flex items-center gap-3 text-left transition-colors border-b border-orange-100/20 dark:border-slate-800/30 cursor-pointer ${
                selectedRoom?._id === globalRoom._id
                  ? 'bg-brand-primary/10 dark:bg-brand-primary/10'
                  : 'hover:bg-orange-50/50 dark:hover:bg-slate-800/30'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-primary to-orange-600 flex items-center justify-center shrink-0 shadow-md shadow-brand-primary/15">
                <Globe size={18} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`font-bold text-xs text-slate-800 dark:text-white truncate ${unreadRooms.includes(globalRoom._id) ? 'font-black text-brand-primary' : ''}`}>
                  Global Announcements
                </p>
                <p className={`text-[10px] truncate ${unreadRooms.includes(globalRoom._id) ? 'text-slate-800 dark:text-slate-200 font-bold' : 'text-slate-400'}`}>
                  {globalRoom.lastMessage || 'No messages yet'}
                </p>
              </div>
              {unreadRooms.includes(globalRoom._id) && (
                <span className="w-2.5 h-2.5 bg-brand-primary rounded-full shrink-0 animate-pulse shadow-[0_0_8px_rgba(232,100,36,0.6)]" />
              )}
              <span className="text-[9px] font-black uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full shrink-0">
                Admin
              </span>
            </button>
          )}

          {/* Personal Rooms */}
          {personalRooms.length > 0 && (
            <div className="p-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 py-2">Personal Chats</p>
              {personalRooms.map(room => {
                const otherParticipant = room.participants.find(p => p._id !== student?._id);
                return (
                  <button
                    key={room._id}
                    onClick={() => handleSelectRoom(room)}
                    className={`w-full p-3 flex items-center gap-3 text-left rounded-xl transition-colors cursor-pointer ${
                      selectedRoom?._id === room._id
                        ? 'bg-brand-primary/10 dark:bg-brand-primary/10'
                        : 'hover:bg-orange-50/50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <img
                      src={otherParticipant?.profilePhoto || getAvatarFallback(otherParticipant?.fullName || 'User')}
                      alt={otherParticipant?.fullName}
                      className="w-9 h-9 rounded-full object-cover border dark:border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`font-bold text-xs text-slate-800 dark:text-white truncate ${unreadRooms.includes(room._id) ? 'font-black text-brand-primary' : ''}`}>
                        {otherParticipant?.fullName || 'Unknown'}
                      </p>
                      <p className={`text-[10px] truncate ${unreadRooms.includes(room._id) ? 'text-slate-800 dark:text-slate-200 font-bold' : 'text-slate-400'}`}>
                        {room.lastMessage || 'Start a conversation'}
                      </p>
                    </div>
                    {unreadRooms.includes(room._id) && (
                      <span className="w-2.5 h-2.5 bg-brand-primary rounded-full shrink-0 animate-pulse shadow-[0_0_8px_rgba(232,100,36,0.6)]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Start new chat button (for non-admin) */}
          {!isAdmin && !personalRooms.length && (
            <div className="p-4">
              <button
                onClick={handleStartPersonalChat}
                disabled={createRoomMutation.isPending}
                className="w-full py-3 bg-brand-primary text-white font-bold text-xs rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {createRoomMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <MessageSquare size={14} />
                )}
                Chat with Admin
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Messages */}
      <div className={`flex-1 flex flex-col ${!selectedRoom ? 'hidden sm:flex' : 'flex'}`}>
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-orange-100/30 dark:border-slate-800/50 flex items-center gap-3 bg-white dark:bg-card-dark">
              <button
                onClick={() => handleSelectRoom(null)}
                className="sm:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ArrowLeft size={18} className="text-slate-600 dark:text-slate-300" />
              </button>

              {selectedRoom.type === 'global' ? (
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-brand-primary to-orange-600 flex items-center justify-center shadow-md">
                  <Globe size={16} className="text-white" />
                </div>
              ) : (
                <img
                  src={selectedRoom.participants.find(p => p._id !== student?._id)?.profilePhoto || getAvatarFallback('User')}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover border dark:border-slate-700"
                />
              )}

              <div>
                <p className="font-bold text-xs text-slate-800 dark:text-white">
                  {selectedRoom.type === 'global'
                    ? 'Global Announcements'
                    : selectedRoom.participants.find(p => p._id !== student?._id)?.fullName || 'Chat'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {selectedRoom.type === 'global' ? 'Broadcast messages to all users' : 'Personal conversation'}
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 dark:bg-page-dark/30">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-brand-primary" size={20} />
                </div>
              ) : allMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                  <MessageSquare size={32} className="text-slate-300 dark:text-slate-600" />
                  <p className="text-xs text-slate-400">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                allMessages.map((msg) => {
                  const isOwn = typeof msg.senderId === 'object' ? msg.senderId._id === student?._id : msg.senderId === student?._id;
                  const senderName = getSenderName(msg.senderId);
                  const senderRole = getSenderRole(msg.senderId);

                  return (
                    <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
                        {!isOwn && (
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{senderName}</span>
                            {senderRole === 'admin' && (
                              <span className="text-[8px] font-black uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded">
                                Admin
                              </span>
                            )}
                          </div>
                        )}
                        <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isOwn
                            ? 'bg-brand-primary text-white rounded-br-md'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-orange-100/20 dark:border-slate-700/50 rounded-bl-md shadow-sm'
                        }`}>
                          {msg.message}
                        </div>
                        <p className={`text-[9px] text-slate-400 mt-1 px-1 ${isOwn ? 'text-right' : ''}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-orange-100/30 dark:border-slate-800/50 bg-white dark:bg-card-dark">
              {selectedRoom.type === 'global' && !isAdmin ? (
                <div className="text-center py-2 text-xs text-slate-400">
                  Only admin can send messages in global announcements
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-orange-100/30 dark:border-slate-700/50 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:border-brand-primary dark:focus:border-brand-secondary transition-colors"
                    disabled={sendMessageMutation.isPending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    className="p-2.5 bg-brand-primary text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-brand-primary/15"
                  >
                    <Send size={16} />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
              <MessageSquare size={28} className="text-brand-primary" />
            </div>
            <div>
              <p className="font-display font-extrabold text-sm text-slate-800 dark:text-white">Select a conversation</p>
              <p className="text-xs text-slate-400 mt-1">Choose a chat from the left to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
