import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Archive, ExternalLink, Clock, X, Filter } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ensureDate } from '../lib/utils';
import { Notification } from '../types';

interface NotificationCenterProps {
  onClose?: () => void;
}

export default function NotificationCenter({ onClose }: NotificationCenterProps) {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    archiveNotification, 
    clearNotifications 
  } = useAppContext();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread' | 'order' | 'payment' | 'message' | 'approval'>('all');

  const filteredNotifications = notifications
    .filter(n => !n.isArchived)
    .filter(n => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !n.isRead;
      return n.type === filter;
    })
    .sort((a, b) => ensureDate(b.createdAt).getTime() - ensureDate(a.createdAt).getTime());

  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      if (onClose) onClose();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Clock className="w-4 h-4" /></div>;
      case 'payment': return <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Check className="w-4 h-4" /></div>;
      case 'message': return <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><ExternalLink className="w-4 h-4" /></div>;
      case 'approval': return <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Bell className="w-4 h-4" /></div>;
      default: return <div className="p-2 bg-gray-100 text-gray-600 rounded-lg"><Bell className="w-4 h-4" /></div>;
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[500px] w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-black text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              {unreadCount} NEW
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => markAllNotificationsAsRead()}
            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider"
            title="Mark all as read"
          >
            Mark all read
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="p-2 border-b border-gray-50 flex gap-1 overflow-x-auto hide-scrollbar">
        {(['all', 'unread', 'order', 'payment', 'message', 'approval'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${
              filter === f ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-grow overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-gray-100 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">No notifications found</p>
            <p className="text-xs text-gray-300 mt-1">We'll let you know when something important happens.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification.id}
                className={`group p-4 flex gap-4 hover:bg-gray-50 transition-all cursor-pointer relative ${!notification.isRead ? 'bg-emerald-50/20' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                {!notification.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                )}
                
                {getIcon(notification.type)}
                
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className={`text-sm font-bold truncate ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ensureDate(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-xs line-clamp-2 ${!notification.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                    {notification.message}
                  </p>
                  
                  {notification.link && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600 group-hover:underline">
                      View Details <ExternalLink className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      archiveNotification(notification.id);
                    }}
                    className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600"
                    title="Archive"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-center">
          <button 
            onClick={() => clearNotifications()}
            className="text-[10px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1 uppercase tracking-wider"
          >
            <Trash2 className="w-3 h-3" /> Clear All
          </button>
        </div>
      )}
    </div>
  );
}
