import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Send, X, User as UserIcon, Store, Image as ImageIcon, Loader2, Plus, ChevronDown, Paperclip, Smile, MoreVertical, Trash2, UserCircle, Check, CheckCheck, MessageSquare } from 'lucide-react';
import { ChatConversation, ChatMessage } from '../../types';
import { ensureDate, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface ChatWindowProps {
  otherUserId: string;
  onClose?: () => void;
}

export default function ChatWindow({ otherUserId, onClose }: ChatWindowProps) {
  const { currentUser, activeMessages, fetchMessages, sendMessage, conversations, setActiveChatUserId, vendors, admins, customers, uploadImage, clearChat } = useAppContext();
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [optimisticImage, setOptimisticImage] = useState<{ id: string, url: string } | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  
  const lastMessageCount = useRef(activeMessages.length);
  
  const conversation = conversations.find(c => c.otherUserId === otherUserId);
  const otherUser = vendors.find(v => v.id === otherUserId) || 
                    admins.find(a => a.id === otherUserId) ||
                    customers.find(c => c.id === otherUserId);
  
  // Fallback to searching in customers if not found in vendors/admins
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
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    const isNewMessage = activeMessages.length > lastMessageCount.current;
    const wasAtBottom = !showScrollButton;
    
    if (isNewMessage && wasAtBottom) {
      scrollToBottom();
    }
    
    lastMessageCount.current = activeMessages.length;
  }, [activeMessages.length, showScrollButton, scrollToBottom]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Show button if user has scrolled up more than 200px from bottom
    const isNearBottom = scrollHeight - scrollTop <= clientHeight + 200;
    setShowScrollButton(!isNearBottom);
  };

  const onEmojiClick = (emojiData: any) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to clear this chat? This action cannot be undone.')) {
      await clearChat(otherUserId);
      setShowMoreMenu(false);
    }
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

  useEffect(() => {
    const handleResize = () => {
      if (document.activeElement?.tagName === 'TEXTAREA') {
        setTimeout(() => scrollToBottom('smooth'), 100);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [scrollToBottom]);

  const handleFocus = () => {
    setTimeout(() => scrollToBottom('smooth'), 300);
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
    <div className="flex flex-col h-full max-h-full bg-[#f0f2f5] relative overflow-hidden">
      {/* Header */}
      <div className="flex-none px-4 sm:px-6 py-3 bg-white border-b border-gray-200 flex justify-between items-center z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
              {otherUser?.role === 'vendor' ? <Store className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 leading-tight truncate">
              {otherUserName}
            </h3>
            <span className="text-[10px] text-gray-500 font-medium">Online</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <div className="relative" ref={moreMenuRef}>
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            <AnimatePresence>
              {showMoreMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50"
                >
                  <button 
                    onClick={() => {
                      alert(`Profile: ${otherUserName}`);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <UserCircle className="w-4 h-4" />
                    View Profile
                  </button>
                  <button 
                    onClick={handleClearChat}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Chat
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative z-10 overscroll-contain"
        style={{ 
          backgroundImage: `url("https://www.transparenttextures.com/patterns/subtle-white-feathers.png")`,
          backgroundColor: '#e5ddd5' // Classic WhatsApp-like background color
        }}
      >
        <div className="flex flex-col space-y-4 pb-4">
          {activeMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-16 h-16 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 border border-white/20 shadow-sm">
                <MessageSquare className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-800">Halal Market Messenger</h4>
              <p className="text-sm text-gray-600 max-w-xs mt-1">
                Start a secure conversation with {otherUserName}.
              </p>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, messages]) => (
              <div key={date} className="space-y-4">
                <div className="flex justify-center sticky top-2 z-20">
                  <span className="px-3 py-1 bg-[#d1f4ff] text-[#075e54] text-[11px] font-bold rounded-lg shadow-sm uppercase tracking-wider">
                    {formatDateHeader(date)}
                  </span>
                </div>
                
                {messages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      key={msg.id}
                      className={cn(
                        "flex w-full mb-1",
                        isMe ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "relative max-w-[85%] sm:max-w-[70%] px-3 py-2 rounded-2xl shadow-sm transition-all hover:shadow-md",
                        isMe 
                          ? "bg-[#dcf8c6] text-gray-800 rounded-tr-none border border-[#c6e9af]" 
                          : "bg-white text-gray-800 rounded-tl-none border border-gray-200"
                      )}>
                        {msg.imageUrl && (
                          <div className="mb-1.5 rounded-xl overflow-hidden shadow-inner bg-gray-100">
                            <img 
                              src={msg.imageUrl} 
                              alt="Shared" 
                              className="max-w-full h-auto max-h-[350px] object-contain cursor-pointer hover:scale-[1.02] transition-transform"
                              referrerPolicy="no-referrer"
                              onClick={() => window.open(msg.imageUrl, '_blank')}
                            />
                          </div>
                        )}
                        {msg.content && (
                          <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap break-words font-medium">
                            {msg.content}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                          <span className="text-[10px] font-medium">
                            {ensureDate(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))
          )}
          
          {optimisticImage && (
            <div className="flex justify-end w-full">
              <div className="bg-[#dcf8c6] p-1 rounded-xl rounded-tr-none shadow-sm max-w-[70%]">
                <div className="relative rounded-lg overflow-hidden">
                  <img src={optimisticImage.url} alt="Uploading" className="opacity-50 blur-[1px] max-h-[200px]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-6 p-2 bg-white text-gray-600 rounded-full shadow-lg border border-gray-200 z-30"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input Bar - FIXED AT BOTTOM */}
      <div className="flex-none bg-[#f0f2f5] p-2 sm:p-3 z-40 border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex items-end gap-2">
          <div className="flex-1 bg-white rounded-2xl flex items-end p-1 shadow-sm border border-gray-200 focus-within:border-emerald-500 transition-colors">
            <div className="relative" ref={emojiPickerRef}>
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-gray-500 hover:text-emerald-600 transition-colors"
              >
                <Smile className="w-6 h-6" />
              </button>
              
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-full left-0 mb-2 z-50"
                  >
                    <EmojiPicker 
                      onEmojiClick={onEmojiClick}
                      width={300}
                      height={400}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-emerald-600 transition-colors"
            >
              <Paperclip className="w-6 h-6" />
            </button>
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
              onFocus={handleFocus}
              placeholder="Type a message"
              className="flex-1 bg-transparent border-none focus:ring-0 py-2 px-2 text-sm text-gray-800 resize-none max-h-[120px] min-h-[36px]"
            />
          </div>

          <button
            onClick={() => handleSend()}
            disabled={(!message.trim() && !optimisticImage) || isUploading}
            className={cn(
              "p-3 rounded-full flex items-center justify-center transition-all",
              (!message.trim() && !optimisticImage) || isUploading
                ? "bg-gray-300 text-gray-500"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md active:scale-95"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center mt-1">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Halal Market Secure End-to-End Encryption</span>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
          border: 2px solid transparent;
          background-clip: content-box;
        }
      `}</style>
    </div>
  );
}
