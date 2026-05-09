# ⚡ NexTalk - Real-Time Team Chat App

A full-stack real-time chat application built with React, Node.js, Socket.io and PostgreSQL. Inspired by Slack.

🌐 **Live Demo:** https://nextalk-7lox8pcje-dulmisehajinis-projects.vercel.app

## ✨ Features

- 🔐 JWT Authentication (Register/Login)
- ⚡ Real-time messaging with WebSockets (Socket.io)
- 📢 Multiple channels (create & delete)
- 👥 Online user presence indicators
- ✍️ Typing indicators ("X is typing...")
- 💬 Message history with date separators
- 🎨 Random avatar colors per user
- 📱 Clean, responsive dark UI

## 🛠️ Tech Stack

**Frontend:**
- React + Vite
- Tailwind CSS
- Socket.io Client
- Axios

**Backend:**
- Node.js + Express.js
- Socket.io
- PostgreSQL (Supabase)
- JWT + bcryptjs

**Deployment:**
- Frontend → Vercel
- Backend → Railway
- Database → Supabase

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL database (Supabase)

### Installation

1. Clone the repo
```bash
git clone https://github.com/dulmisehajini/nextalk.git
cd nextalk
```

2. Install server dependencies
```bash
cd server
npm install
```

3. Install client dependencies
```bash
cd ../client
npm install
```

4. Set up environment variables

Create `server/.env`:
```env
DB_HOST=your_supabase_host
DB_NAME=postgres
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_PORT=5432
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

5. Set up the database

Run the SQL in `server/db.sql` on your Supabase project.

6. Start the development servers

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

## 📸 Screenshots

![NexTalk Chat Interface](screenshots/chat.png)

## 🗄️ Database Schema

```sql
users     - id, username, email, password, avatar_color, created_at
channels  - id, name, description, created_by, created_at
messages  - id, content, user_id, channel_id, created_at
```

## 👩‍💻 Author

**Dulmi Sehajini**
- GitHub: [@dulmisehajini](https://github.com/dulmisehajini)

## 📝 License

MIT License