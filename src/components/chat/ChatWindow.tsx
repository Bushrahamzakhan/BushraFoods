import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Send, X, User as UserIcon, Store, Image as ImageIcon, Loader2 } from 'lucide-react';
import { ChatConversation } from '../../types';
import { ensureDate } from '../../lib/utils';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const conversation = conversations.find(c => c.otherUserId === otherUserId);
  const otherUser = vendors.find(v => v.id === otherUserId);
  const otherUserName = conversation?.otherUserName || otherUser?.storeName || otherUser?.name || 'Chat';

  useEffect(() => {
    const unsubscribe = fetchMessages(otherUserId);
    return () => {
      unsubscribe();
      setActiveChatUserId(null);
    };
  }, [otherUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optimistic UI: Create a temporary message with a local preview
    const tempId = `temp-${Date.now()}`;
    const localUrl = URL.createObjectURL(file);
    
    // We can't easily inject into the messages list because it's managed by AppContext/Firestore
    // but we can set a local state to show the "uploading" message at the bottom
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    await sendMessage(otherUserId, message);
    setMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-green-600 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">
              {otherUserName}
            </h3>
            <p className="text-[10px] text-green-100 uppercase tracking-widest font-bold">Online</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-50">
        {activeMessages.map((msg) => {
          const isMe = msg.senderId === currentUser?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                isMe 
                  ? 'bg-green-600 text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm'
              }`}>
                {msg.imageUrl && (
                  <div className="mb-2 rounded-lg overflow-hidden border border-black/5">
                    <img 
                      src={msg.imageUrl} 
                      alt="Shared image" 
                      className="max-w-full h-auto max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(msg.imageUrl, '_blank')}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>
                )}
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-green-100' : 'text-gray-400'}`}>
                  {ensureDate(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}

        {/* Optimistic Image Preview */}
        {optimisticImage && (
          <div className="flex justify-end">
            <div className="max-w-[80%] px-4 py-2 rounded-2xl text-sm bg-green-600/50 text-white rounded-tr-none relative overflow-hidden">
              <div className="mb-2 rounded-lg overflow-hidden border border-white/10 relative">
                <img 
                  src={optimisticImage.url} 
                  alt="Uploading..." 
                  className="max-w-full h-auto max-h-60 object-cover opacity-50"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20">
                  <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <div className="w-2/3 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-white">{uploadProgress}%</p>
                </div>
              </div>
              <p className="text-[10px] mt-1 text-green-100 italic">Sending...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
            accept="image/*" 
          />
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!message.trim() || isUploading}
            className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all shadow-md shadow-green-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
