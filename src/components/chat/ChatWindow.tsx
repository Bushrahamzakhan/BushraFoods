import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Send, X, User as UserIcon, Store } from 'lucide-react';
import { ChatConversation } from '../../types';

interface ChatWindowProps {
  otherUserId: string;
  onClose?: () => void;
}

export default function ChatWindow({ otherUserId, onClose }: ChatWindowProps) {
  const { currentUser, activeMessages, fetchMessages, sendMessage, conversations, setActiveChatUserId, vendors } = useAppContext();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const conversation = conversations.find(c => c.otherUser.id === otherUserId);
  const otherUser = conversation?.otherUser || vendors.find(v => v.id === otherUserId);

  useEffect(() => {
    fetchMessages(otherUserId);
    const interval = setInterval(() => fetchMessages(otherUserId), 10000); // Polling as fallback
    return () => {
      clearInterval(interval);
      setActiveChatUserId(null);
    };
  }, [otherUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

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
              {otherUser?.storeName || otherUser?.name || 'Chat'}
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
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-green-100' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all shadow-md shadow-green-100"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
