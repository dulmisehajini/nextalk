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
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const socketRef = useRef(null);
  const channelsRef = useRef([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Connect to Socket.io
  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      console.log('⚡ Connected to NexTalk!');
      // Auto join first channel AFTER socket is connected
      const savedChannels = channelsRef.current;
      if (savedChannels && savedChannels.length > 0) {
        handleChannelSelect(savedChannels[0]);
      }
    });

    socketRef.current.on('message-history', (history) => {
      setMessages(history);
      setLoading(false);
    });

    socketRef.current.on('receive-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

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
        channelsRef.current = res.data;
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
    setLoading(true);
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

  const handleDeleteChannel = async (channel) => {
    setDeleteConfirm(channel);
  };

  const confirmDelete = async () => {
    const channel = deleteConfirm;
    setDeleteConfirm(null);
    try {
      await axios.delete(`/api/channels/${channel.id}`);
      setChannels((prev) => prev.filter((c) => c.id !== channel.id));
      if (currentChannel?.id === channel.id) {
        const general = channels.find((c) => c.name === 'general');
        if (general) handleChannelSelect(general);
        else setCurrentChannel(null);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to delete channel');
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
        onlineUsers={onlineUsers}
        onDeleteChannel={handleDeleteChannel}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">

        {/* ✅ NEW — No channel selected */}
        {!currentChannel && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-5xl mb-3">💬</p>
              <p className="text-white font-semibold text-lg">Welcome to NexTalk!</p>
              <p className="text-gray-400 text-sm mt-1">Select a channel to start chatting</p>
            </div>
          </div>
        )}

        {/* Channel Header */}
        {currentChannel && (
          <div className="px-6 border-b border-gray-700 bg-gray-800 flex items-center justify-between" style={{height: '64px'}}>
            <div>
              <h2 className="text-white font-semibold text-lg">
                {currentChannel.name}
              </h2>
              {currentChannel.description && (
                <p className="text-gray-400 text-sm">{currentChannel.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-400 text-sm">
                {onlineUsers.length} online
              </span>
            </div>
          </div>
        )}

        {/* Messages */}
        {currentChannel && (
          <MessageList
            messages={messages}
            typingUser={typingUser}
            loading={loading}
          />
        )}

        {/* Message Input */}
        {currentChannel && (
          <MessageInput
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            onStopTyping={handleStopTyping}
            channelName={currentChannel?.name}
          />
        )}
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
                placeholder="Channel name"
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Delete Channel</h3>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to delete <span className="text-white font-semibold">"{deleteConfirm.name}"</span>? This will delete all messages too. This cannot be undone!
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-red-400 font-bold text-lg mb-2">⚠️ Error</h3>
            <p className="text-gray-300 text-sm mb-6">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

    </div>

    
  );
};

export default Chat;