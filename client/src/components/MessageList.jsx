import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const MessageList = ({ messages, typingUser }) => {
  const { user } = useAuth();
  const bottomRef = useRef(null);

  // Auto scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="text-center text-gray-500 mt-10">
          <p className="text-4xl mb-2">💬</p>
          <p>No messages yet. Be the first to say something!</p>
        </div>
      )}

      {messages.map((msg) => {
        const isOwn = msg.user_id === user?.id || msg.userId === user?.id;

        return (
          <div key={msg.id} className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: msg.avatar_color || msg.avatarColor || '#5865F2' }}
            >
              {(msg.username || 'U').charAt(0).toUpperCase()}
            </div>

            {/* Message bubble */}
            <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                <span className="text-gray-400 text-xs font-medium">{msg.username}</span>
                <span className="text-gray-600 text-xs">
                  {formatTime(msg.created_at || msg.createdAt)}
                </span>
              </div>
              <div
                className={`px-4 py-2 rounded-2xl text-sm ${
                  isOwn
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-gray-700 text-gray-100 rounded-tl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        );
      })}

      {/* Typing indicator */}
      {typingUser && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
          <span>{typingUser} is typing...</span>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;