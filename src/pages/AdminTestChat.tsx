import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useChatRooms, useChatMessages, useSendChatMessage } from '../hooks/useChat';
import { useChatContext } from '../context/ChatContext';
import type { ChatMessage, ChatRoom } from '../services/chat.service';
import { ShieldCheck, Globe, Send, Loader2, Users, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageChildVariants } from '../components/PageTransition';
import { getAvatarFallback, getImageUrl } from '../utils/fallbacks';

export const AdminTestChat = () => {
  const { student } = useAuth();
  const { socket } = useChatContext();
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
  };

  const { data: roomsRes, isLoading: roomsLoading } = useChatRooms();
  const { data: messagesRes, isLoading: messagesLoading } = useChatMessages(selectedRoom?._id || null);
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

  useEffect(() => {
    if (!socket) return;
    const handleMessage = (data: { roomId: string; message: ChatMessage }) => {
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

  useEffect(() => {
    if (!socket) return;
    const handleRoomCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    };
    socket.on('room_created', handleRoomCreated);
    return () => { socket.off('room_created', handleRoomCreated); };
  }, [socket, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);



  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    const msg = messageInput.trim();
    setMessageInput('');
    try {
      await sendMessageMutation.mutateAsync({ roomId: selectedRoom?._id, message: msg });
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

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center space-y-4">
        <ShieldCheck size={48} className="text-slate-300" />
        <div>
          <h2 className="font-display font-extrabold text-xl text-slate-800 dark:text-white">Admin Access Required</h2>
          <p className="text-xs text-slate-400 mt-2">This page is only accessible to admin users.</p>
        </div>
      </div>
    );
  }

  if (roomsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="animate-spin text-brand-primary" size={24} />
      </div>
    );
  }

  return (
    <motion.div variants={pageChildVariants} className="space-y-6">
      {/* Admin Header */}
      <div className="flex items-center gap-3 p-4 bg-linear-to-r from-brand-primary/10 to-orange-50 dark:from-brand-primary/10 dark:to-slate-800/30 rounded-2xl border border-brand-primary/15">
        <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center shadow-md">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <div>
          <h2 className="font-display font-extrabold text-sm text-slate-800 dark:text-white">Admin Chat Panel</h2>
          <p className="text-[10px] text-slate-400">Send global announcements and reply to student conversations</p>
        </div>
      </div>

      <div className="flex h-[calc(100vh-12rem)] bg-white dark:bg-page-dark rounded-3xl border border-orange-100/30 dark:border-slate-800/50 overflow-hidden">
        {/* Left Panel */}
        <div className={`w-full sm:w-80 border-r border-orange-100/30 dark:border-slate-800/50 flex flex-col bg-slate-50/50 dark:bg-slate-900/30 ${selectedRoom ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-4 border-b border-orange-100/30 dark:border-slate-800/50">
            <h3 className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-2">
              <Users size={14} className="text-brand-primary" />
              Conversations ({rooms.length})
            </h3>
          </div>

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
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-primary to-orange-600 flex items-center justify-center shadow-md shadow-brand-primary/15">
                  <Globe size={18} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-slate-800 dark:text-white">Global Announcements</p>
                  <p className="text-[10px] text-slate-400 truncate">{globalRoom.lastMessage || 'No messages yet'}</p>
                </div>
              </button>
            )}

            {/* Personal Rooms */}
            {personalRooms.length > 0 && (
              <div className="p-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 py-2">Student Chats</p>
                {personalRooms.map(room => {
                  const other = room.participants.find(p => p.role !== 'admin');
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
                        src={getImageUrl(other?.profilePhoto) || getAvatarFallback(other?.fullName || 'Student')}
                        alt={other?.fullName}
                        className="w-9 h-9 rounded-full object-cover border dark:border-slate-700 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-slate-800 dark:text-white truncate">{other?.fullName || 'Student'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{room.lastMessage || 'No messages'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {personalRooms.length === 0 && !globalRoom && (
              <div className="p-6 text-center">
                <MessageSquare size={24} className="text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No conversations yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className={`flex-1 flex flex-col ${!selectedRoom ? 'hidden sm:flex' : 'flex'}`}>
          {selectedRoom ? (
            <>
              <div className="p-4 border-b border-orange-100/30 dark:border-slate-800/50 bg-white dark:bg-card-dark">
                <p className="font-bold text-xs text-slate-800 dark:text-white">
                  {selectedRoom.type === 'global' ? '📢 Global Announcements' : `💬 Chat with ${selectedRoom.participants.find(p => p.role !== 'admin')?.fullName || 'Student'}`}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 dark:bg-page-dark/30">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="animate-spin text-brand-primary" size={20} />
                  </div>
                ) : allMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                    <MessageSquare size={32} className="text-slate-300 dark:text-slate-600" />
                    <p className="text-xs text-slate-400">No messages yet</p>
                  </div>
                ) : (
                  allMessages.map((msg) => {
                    const isOwn = typeof msg.senderId === 'object' ? msg.senderId._id === student?._id : msg.senderId === student?._id;
                    const senderName = typeof msg.senderId === 'object' ? msg.senderId.fullName : 'Unknown';
                    const senderRole = typeof msg.senderId === 'object' ? msg.senderId.role : 'user';

                    return (
                      <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[75%]">
                          {!isOwn && (
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{senderName}</span>
                              {senderRole === 'admin' && (
                                <span className="text-[8px] font-black uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded">Admin</span>
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

              <div className="p-4 border-t border-orange-100/30 dark:border-slate-800/50 bg-white dark:bg-card-dark">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedRoom.type === 'global' ? 'Broadcast to all users...' : 'Reply to student...'}
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
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
              <ShieldCheck size={32} className="text-slate-300 dark:text-slate-600" />
              <p className="text-xs text-slate-400">Select a conversation to view messages</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
