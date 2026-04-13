import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { User as UserIcon, MessageSquare, Search } from 'lucide-react';
import { ChatConversation } from '../../types';
import { ensureDate, cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface ChatListProps {
  onSelect: (userId: string) => void;
  activeUserId?: string;
}

export default function ChatList({ onSelect, activeUserId }: ChatListProps) {
  const { conversations } = useAppContext();

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full bg-gray-50/30">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-300 mb-6 border border-gray-100">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-gray-900 mb-2">No messages yet</h3>
        <p className="text-sm text-gray-500 max-w-[200px] mx-auto">When you start a conversation, it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search messages..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex-grow overflow-y-auto min-h-0 custom-scrollbar">
        <div className="divide-y divide-gray-50">
          {conversations.map((conv, index) => {
            const isActive = activeUserId === conv.otherUserId;
            return (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                key={conv.id}
                onClick={() => onSelect(conv.otherUserId)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-all text-left relative group",
                  isActive ? "bg-emerald-50/50" : ""
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600 rounded-r-full" 
                  />
                )}
                
                <div className="relative flex-shrink-0">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden border transition-all duration-300",
                    isActive ? "border-emerald-200 shadow-sm" : "border-gray-100 group-hover:border-emerald-100"
                  )}>
                    {conv.otherUserProfileImage ? (
                      <img 
                        src={conv.otherUserProfileImage} 
                        alt={conv.otherUserName} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <UserIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                  {conv.unreadCount > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white px-1 shadow-sm">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={cn(
                      "truncate text-sm transition-colors",
                      conv.unreadCount > 0 || isActive ? "font-bold text-gray-900" : "font-medium text-gray-700"
                    )}>
                      {conv.otherUserName}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap ml-2">
                      {conv.lastMessage && ensureDate(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {conv.lastMessage && (
                    <p className={cn(
                      "text-xs truncate transition-colors",
                      conv.unreadCount > 0 ? "text-emerald-700 font-bold" : "text-gray-500"
                    )}>
                      {conv.lastMessage.senderId === conv.otherUserId ? '' : 'You: '}
                      {conv.lastMessage.content || (conv.lastMessage.imageUrl ? 'Shared an image' : '')}
                    </p>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
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
