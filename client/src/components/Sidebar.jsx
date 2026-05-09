import { useAuth } from '../context/AuthContext';

const Sidebar = ({ channels, currentChannel, onChannelSelect, onNewChannel, onlineUsers }) => {
  const { user, logout } = useAuth();

  return (
    <div className="w-64 bg-gray-800 flex flex-col h-screen">
      {/* App Header */}
      <div className="px-4 border-b border-gray-700 flex items-center" style={{height: '64px'}}>
        <h1 className="text-white font-bold text-xl">⚡ NexTalk</h1>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            Channels
          </span>
          <button
            onClick={onNewChannel}
            className="text-gray-400 hover:text-white text-xl leading-none"
            title="New Channel"
          >
            +
          </button>
        </div>

        {/* Channel Items */}
        <div className="space-y-1 mb-6">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onChannelSelect(channel)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition duration-150 ${
                currentChannel?.id === channel.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              # {channel.name}
            </button>
          ))}
        </div>

        {/* ✅ NEW — Online Users Section */}
        {onlineUsers && onlineUsers.length > 0 && (
          <div>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
              Online — {onlineUsers.length}
            </span>
            <div className="space-y-1 mt-2">
              {onlineUsers.map((onlineUser) => (
                <div key={onlineUser.id} className="flex items-center gap-2 px-3 py-1">
                  <div className="relative">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: onlineUser.avatarColor || '#5865F2' }}
                    >
                      {onlineUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-gray-800"></div>
                  </div>
                  <span className="text-gray-300 text-sm truncate">{onlineUser.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Info at bottom */}
      <div className="px-4 py-4 border-t border-gray-700 flex items-center gap-3" style={{height: '105px'}}>
        {/* ✅ NEW — Avatar with green online dot */}
        <div className="relative">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: user?.avatarColor || '#5865F2' }}
          >
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-gray-800"></div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{user?.username}</p>
          {/* ✅ NEW — Online status */}
          <p className="text-green-400 text-xs">Online</p>
        </div>
        <button
          onClick={logout}
          className="text-gray-400 hover:text-red-400 text-xs transition"
          title="Logout"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Sidebar;