import { useState, useRef } from 'react';

const MessageInput = ({ onSendMessage, onTyping, onStopTyping, channelName }) => {
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef(null);

  const handleChange = (e) => {
    setMessage(e.target.value);

    // Typing indicator
    onTyping();

    // Stop typing after 1 second of no input
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 1000);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage('');
    onStopTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 py-3 border-t border-gray-700 bg-gray-900">
      <div className="flex items-center gap-3 bg-gray-700 rounded-xl px-4 py-3">
        <input
          type="text"
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={channelName ? `Message # ${channelName}` : 'Type a message...'} {/* ✅ NEW */}
          className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-sm"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
        >
          Send ➤ {/* ✅ NEW - added arrow */}
        </button>
      </div>
      <p className="text-gray-600 text-xs mt-1 ml-1">
        Press Enter to send
      </p>
    </div>
  );
};

export default MessageInput;