import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import { io } from 'socket.io-client';
import axios from 'axios';

const Chat = () => {
  const { user, token } = useAuth();
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]); // ✅ NEW
  const [loading, setLoading] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const socketRef = useRef(null);

  // Connect to Socket.io
  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      console.log('⚡ Connected to NexTalk!');
    });

    socketRef.current.on('message-history', (history) => {
      setMessages(history);
      setLoading(false); // ✅ NEW
    });

    socketRef.current.on('receive-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // ✅ NEW - Online users
    socketRef.current.on('online-users', (users) => {
      setOnlineUsers(users);
    });

    socketRef.current.on('user-typing', ({ username }) => {
      setTypingUser(username);
    });

    socketRef.current.on('user-stop-typing', () => {
      setTypingUser(null);
    });

    socketRef.current.on('user-joined', ({ username }) => {
      console.log(`${username} joined the channel`);
    });

    // ✅ NEW - User left
    socketRef.current.on('user-left', ({ username }) => {
      console.log(`${username} left the channel`);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [token]);

  // Fetch channels on load
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await axios.get('/api/channels');
        setChannels(res.data);
        if (res.data.length > 0) {
          handleChannelSelect(res.data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch channels:', error);
      }
    };
    fetchChannels();
  }, []);

  const handleChannelSelect = (channel) => {
    setCurrentChannel(channel);
    setMessages([]);
    setTypingUser(null);
    setOnlineUsers([]);
    setLoading(true); // ✅ NEW
    if (socketRef.current) {
      socketRef.current.emit('join-channel', channel.id);
    }
  };

  const handleSendMessage = (content) => {
    if (!currentChannel) return;
    socketRef.current.emit('send-message', {
      channelId: currentChannel.id,
      content
    });
  };

  const handleTyping = () => {
    if (!currentChannel) return;
    socketRef.current.emit('typing-start', currentChannel.id);
  };

  const handleStopTyping = () => {
    if (!currentChannel) return;
    socketRef.current.emit('typing-stop', currentChannel.id);
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    try {
      const res = await axios.post('/api/channels', {
        name: newChannelName,
        description: newChannelDesc
      });
      setChannels((prev) => [...prev, res.data]);
      setNewChannelName('');
      setNewChannelDesc('');
      setShowNewChannel(false);
      handleChannelSelect(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create channel');
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        channels={channels}
        currentChannel={currentChannel}
        onChannelSelect={handleChannelSelect}
        onNewChannel={() => setShowNewChannel(true)}
        onlineUsers={onlineUsers} // ✅ NEW
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Channel Header */}
        {currentChannel && (
          <div className="px-6 border-b border-gray-700 bg-gray-800 flex items-center justify-between" style={{height: '64px'}}>
            <div>
              <h2 className="text-white font-semibold text-lg">
                # {currentChannel.name}
              </h2>
              {currentChannel.description && (
                <p className="text-gray-400 text-sm">{currentChannel.description}</p>
              )}
            </div>
            {/* Online count */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-400 text-sm">
                {onlineUsers.length} online
              </span>
            </div>
          </div>
        )}

        {/* Messages */}
        <MessageList
          messages={messages}
          typingUser={typingUser}
          loading={loading}
        />

        {/* Message Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onStopTyping={handleStopTyping}
          channelName={currentChannel?.name}
        />
      </div>

      {/* New Channel Modal */}
      {showNewChannel && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-4">Create New Channel</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="channel-name"
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                value={newChannelDesc}
                onChange={(e) => setNewChannelDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCreateChannel}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
                >
                  Create Channel
                </button>
                <button
                  onClick={() => setShowNewChannel(false)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;