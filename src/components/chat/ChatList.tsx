import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { User as UserIcon, MessageSquare } from 'lucide-react';
import { ChatConversation } from '../../types';
import { ensureDate } from '../../lib/utils';

interface ChatListProps {
  onSelect: (userId: string) => void;
  activeUserId?: string;
}

export default function ChatList({ onSelect, activeUserId }: ChatListProps) {
  const { conversations } = useAppContext();

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-gray-100">
        <MessageSquare className="w-12 h-12 text-gray-200 mb-4" />
        <h3 className="font-bold text-gray-900 mb-1">No messages yet</h3>
        <p className="text-xs text-gray-500">When you start a conversation, it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">Messages</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {conversations.map((conv) => (
          <button
            key={conv.otherUserId}
            onClick={() => onSelect(conv.otherUserId)}
            className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left ${
              activeUserId === conv.otherUserId ? 'bg-green-50/50 border-l-4 border-green-600' : ''
            }`}
          >
            <div className="relative">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center overflow-hidden border border-green-50">
                {conv.otherUserProfileImage ? (
                  <img 
                    src={conv.otherUserProfileImage} 
                    alt={conv.otherUserName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                ) : (
                  <UserIcon className="w-6 h-6 text-green-600" />
                )}
              </div>
              {conv.unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {conv.unreadCount}
                </div>
              )}
            </div>
            <div className="flex-grow min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-gray-900 truncate text-sm">
                  {conv.otherUserName}
                </h4>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  {conv.lastMessage && ensureDate(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {conv.lastMessage && (
                <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                  {conv.lastMessage.senderId === conv.otherUserId ? '' : 'You: '}
                  {conv.lastMessage.content}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
