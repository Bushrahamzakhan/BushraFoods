import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Send, X, User as UserIcon, Store, Image as ImageIcon, Loader2, Plus, ChevronDown, Paperclip, Smile, MoreVertical } from 'lucide-react';
import { ChatConversation, ChatMessage } from '../../types';
import { ensureDate, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ChatWindowProps {
  otherUserId: string;
  onClose?: () => void;
}

export default function ChatWindow({ otherUserId, onClose }: ChatWindowProps) {
  const { currentUser, activeMessages, fetchMessages, sendMessage, conversations, setActiveChatUserId, vendors, uploadImage } = useAppContext();
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [optimisticImage, setOptimisticImage] = useState<{ id: string, url: string } | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const conversation = conversations.find(c => c.otherUserId === otherUserId);
  const otherUser = vendors.find(v => v.id === otherUserId);
  const otherUserName = conversation?.otherUserName || otherUser?.storeName || otherUser?.name || 'Chat';

  // Intelligent scrolling logic
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior
      });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = fetchMessages(otherUserId);
    // Initial scroll to bottom
    setTimeout(() => scrollToBottom('auto'), 100);
    
    return () => {
      unsubscribe();
      setActiveChatUserId(null);
    };
  }, [otherUserId, fetchMessages, setActiveChatUserId, scrollToBottom]);

  useEffect(() => {
    // Only auto-scroll to bottom if user is already near the bottom
    // or if it's the very first load of messages
    if (!showScrollButton) {
      scrollToBottom();
    }
  }, [activeMessages.length, showScrollButton, scrollToBottom]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop <= clientHeight + 150;
    setShowScrollButton(!isNearBottom);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tempId = `temp-${Date.now()}`;
    const localUrl = URL.createObjectURL(file);
    
    setOptimisticImage({ id: tempId, url: localUrl });
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const url = await uploadImage(file, 'chat', (progress) => {
        setUploadProgress(Math.round(progress));
      });
      await sendMessage(otherUserId, '', url);
      setOptimisticImage(null);
    } catch (error) {
      console.error("Failed to upload image:", error);
      setOptimisticImage(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || isUploading) return;
    
    const content = message.trim();
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    await sendMessage(otherUserId, content);
    scrollToBottom();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  // Group messages by date
  const groupedMessages = activeMessages.reduce((groups: { [key: string]: ChatMessage[] }, message) => {
    const date = ensureDate(message.createdAt).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden relative">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
              {otherUser?.role === 'vendor' ? <Store className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">
              {otherUserName}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Active Now</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all">
            <MoreVertical className="w-5 h-5" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-grow overflow-y-auto min-h-0 p-6 bg-gray-50/50 scroll-smooth custom-scrollbar"
      >
        <div className="flex flex-col space-y-8">
          {Object.entries(groupedMessages).map(([date, messages]) => (
            <div key={date} className="space-y-6">
              <div className="flex justify-center">
                <span className="px-4 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest shadow-sm">
                  {formatDateHeader(date)}
                </span>
              </div>
              
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      key={msg.id} 
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={cn(
                        "max-w-[85%] sm:max-w-[70%] group relative",
                        isMe ? "items-end" : "items-start"
                      )}>
                        <div className={cn(
                          "px-4 py-3 rounded-2xl text-sm shadow-sm transition-all duration-200",
                          isMe 
                            ? "bg-emerald-600 text-white rounded-tr-none hover:bg-emerald-700" 
                            : "bg-white text-gray-800 border border-gray-100 rounded-tl-none hover:border-emerald-100"
                        )}>
                          {msg.imageUrl && (
                            <div className="mb-2 rounded-xl overflow-hidden border border-black/5 bg-gray-100">
                              <img 
                                src={msg.imageUrl} 
                                alt="Shared image" 
                                className="max-w-full h-auto max-h-80 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(msg.imageUrl, '_blank')}
                                referrerPolicy="no-referrer"
                                loading="lazy"
                              />
                            </div>
                          )}
                          {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                          <div className={cn(
                            "flex items-center gap-1 mt-1.5",
                            isMe ? "justify-end text-emerald-100" : "justify-start text-gray-400"
                          )}>
                            <span className="text-[10px] font-medium">
                              {ensureDate(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              <div className="flex">
                                <span className="w-3 h-3 flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                  </svg>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Optimistic Image Preview */}
          <AnimatePresence>
            {optimisticImage && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex justify-end"
              >
                <div className="max-w-[70%] px-4 py-3 rounded-2xl text-sm bg-emerald-600/90 text-white rounded-tr-none relative overflow-hidden shadow-lg">
                  <div className="mb-2 rounded-xl overflow-hidden border border-white/10 relative bg-emerald-800/20">
                    <img 
                      src={optimisticImage.url} 
                      alt="Uploading..." 
                      className="max-w-full h-auto max-h-80 object-cover opacity-40 blur-[2px]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-white" 
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-black text-white drop-shadow-md">{uploadProgress}%</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] mt-1 text-emerald-100 italic font-medium flex items-center gap-1.5">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    Sending image...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-28 right-8 p-3 bg-white text-emerald-600 rounded-full shadow-2xl border border-gray-100 hover:bg-emerald-50 transition-all z-20 group"
          >
            <ChevronDown className="w-6 h-6 group-hover:translate-y-0.5 transition-transform" />
            {activeMessages.length > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 rounded-full border-2 border-white"></div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 sm:p-6 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <form 
            onSubmit={handleSend} 
            className="relative flex items-end gap-3 bg-gray-50 p-2 rounded-[24px] border border-gray-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all duration-300"
          >
            <div className="flex items-center gap-1 pl-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all"
                title="Attach image"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
              </button>
              <button
                type="button"
                className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all hidden sm:flex"
                title="Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
              accept="image/*" 
            />

            <textarea
              ref={textareaRef}
              rows={1}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-grow bg-transparent border-none focus:ring-0 py-3 px-1 text-sm text-gray-800 placeholder:text-gray-400 resize-none max-h-[150px] min-h-[44px] custom-scrollbar"
            />

            <div className="pr-1 pb-1">
              <button
                type="submit"
                disabled={(!message.trim() && !optimisticImage) || isUploading}
                className={cn(
                  "p-3 rounded-full transition-all duration-300 shadow-lg shadow-emerald-100 flex items-center justify-center",
                  (!message.trim() && !optimisticImage) || isUploading
                    ? "bg-gray-200 text-gray-400 shadow-none"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 active:scale-95"
                )}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
          <p className="text-[10px] text-gray-400 mt-2 text-center font-medium">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
