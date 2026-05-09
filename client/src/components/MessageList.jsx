import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const MessageList = ({ messages, typingUser, loading }) => {
  const { user } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'long', day: 'numeric' });
  };

  // Group messages by user and time
  const groupedMessages = messages.reduce((groups, message, index) => {
    const prevMessage = messages[index - 1];
    const isSameUser = prevMessage && prevMessage.username === message.username;
    const timeDiff = prevMessage
      ? (new Date(message.created_at || message.createdAt) -
          new Date(prevMessage.created_at || prevMessage.createdAt)) / 1000 / 60
      : 999;
    const isGrouped = isSameUser && timeDiff < 5;

    groups.push({ ...message, isGrouped });
    return groups;
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {messages.length === 0 && (
        <div className="text-center mt-20">
          <p className="text-5xl mb-3">💬</p>
          <p className="text-white font-semibold text-lg">No messages yet</p>
          <p className="text-gray-400 text-sm mt-1">Be the first to say something!</p>
        </div>
      )}

      {groupedMessages.map((msg, index) => {
        const isOwn = msg.user_id === user?.id || msg.userId === user?.id;
        const showDateSeparator =
          index === 0 ||
          formatDate(msg.created_at || msg.createdAt) !==
            formatDate(groupedMessages[index - 1]?.created_at || groupedMessages[index - 1]?.createdAt);

        return (
          <div key={msg.id}>
            {/* Date separator */}
            {showDateSeparator && (
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-700"></div>
                <span className="text-gray-400 text-xs font-medium">
                  {formatDate(msg.created_at || msg.createdAt)}
                </span>
                <div className="flex-1 h-px bg-gray-700"></div>
              </div>
            )}

            {/* Message */}
            <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''} ${msg.isGrouped ? 'mt-0.5' : 'mt-3'}`}>
              {/* Avatar - hide if grouped */}
              {!msg.isGrouped ? (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: msg.avatar_color || msg.avatarColor || '#5865F2' }}
                >
                  {(msg.username || 'U').charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="w-8 flex-shrink-0"></div>
              )}

              {/* Message content */}
              <div className={`max-w-xs lg:max-w-md flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                {/* Username + time - hide if grouped */}
                {!msg.isGrouped && (
                  <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <span className="text-gray-300 text-xs font-semibold">{msg.username}</span>
                    <span className="text-gray-500 text-xs">
                      {formatTime(msg.created_at || msg.createdAt)}
                    </span>
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                    isOwn
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-gray-700 text-gray-100 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Typing indicator */}
      {typingUser && (
        <div className="flex items-center gap-2 text-gray-400 text-sm mt-3 ml-10">
          <div className="bg-gray-700 px-4 py-2 rounded-2xl rounded-bl-none flex items-center gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
          <span className="text-xs">{typingUser} is typing...</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;