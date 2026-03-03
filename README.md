# 🧞 Campus Genie — AI Learning Platform

> An AI-powered study companion for students. Get instant explanations, generate study media, practice MCQs, watch curated YouTube tutorials in your preferred language, and track your progress — all in one place.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Chat** | Conversational study assistant powered by Google Gemini 2.5 Flash |
| 🎓 **MCQ Practice** | Auto-generated multiple-choice questions per subject & topic |
| 🎬 **YouTube Videos** | Curated educational videos with multi-language support (28 languages) |
| 🖼️ **Media Studio** | AI-generated diagrams, flashcards, and study notes |
| 🎨 **AI Image Generation** | Generate educational images from text prompts via ImageKit (10 styles) |
| 📊 **Dashboard** | Study stats, streak tracking, and progress charts |
| 🔐 **Auth** | JWT-based register / login with bcrypt password hashing |
| 🛡️ **Admin Panel** | User management and platform statistics |
| 🌙 **Dark Mode** | Full dark/light theme support |
| 📱 **Responsive** | Mobile-friendly sidebar and layouts |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite** — fast dev server & bundler
- **TailwindCSS** — utility-first styling
- **React Router v6** — client-side routing
- **Zustand** — lightweight state management
- **Recharts** — progress & stats charts
- **Lucide React** — icon library
- **Axios** — HTTP client
- **react-hot-toast** — notifications

### Backend
- **Node.js** + **Express** — REST API server
- **MySQL 2** — relational database
- **Google Gemini 2.5 Flash** (`@google/generative-ai`) — AI responses & content generation
- **ImageKit** — AI image generation from text prompts
- **YouTube Data API v3** — video search & recommendations
- **JWT** + **bcryptjs** — authentication & security
- **Helmet** + **express-rate-limit** — API security
- **Multer** — file uploads
- **Nodemon** — dev auto-reload

### Infrastructure (optional)
- **Docker** + **Docker Compose** — containerised dev & prod environments
- **Nginx** — reverse proxy for production
- **PM2** — process management (`ecosystem.config.js`)

---

## 📁 Project Structure

```
campus-genie/
├── backend/
│   ├── config/          # DB setup, Gemini client
│   ├── controllers/     # Route handler logic
│   ├── middleware/       # Auth, error handler, rate limiting
│   ├── models/          # DB query helpers
│   ├── routes/          # Express routers
│   ├── utils/           # Helper utilities
│   └── server.js        # App entry point
│
├── frontend/
│   ├── public/          # Static assets (logo, etc.)
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── hooks/       # Custom React hooks
│       ├── pages/       # Page-level components
│       ├── services/    # API service layer (Axios)
│       ├── store/       # Zustand state stores
│       └── utils/       # Constants, helpers
│
├── mysql/               # Database init scripts
├── nginx/               # Nginx config
├── scripts/             # Setup & utility scripts
└── docker-compose.yml
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MySQL** 8.0+
- **Google Gemini API Key** — [Get one here](https://aistudio.google.com/app/apikey)
- **YouTube Data API v3 Key** — [Get one here](https://console.cloud.google.com/)
- **ImageKit Account** — [Sign up here](https://imagekit.io/) (for AI image generation)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/campus-genie.git
cd campus-genie
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_study_buddy

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

GEMINI_API_KEY=your_gemini_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here

IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

FRONTEND_URL=http://localhost:5173
```

Set up the database:

```bash
npm run db:setup
```

Start the backend server:

```bash
npm run dev        # development (nodemon)
npm start          # production
```

The API will be running at **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be running at **http://localhost:5173**

---

### 4. Docker (optional)

```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔌 API Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/auth/register` | Create account | ❌ |
| POST | `/api/auth/login` | Login & get JWT | ❌ |
| GET | `/api/dashboard/stats` | User study stats | ✅ |
| POST | `/api/chat/send` | Send message to AI | ✅ |
| GET | `/api/chat/history` | Chat history | ✅ |
| GET | `/api/subjects` | List subjects | ✅ |
| GET | `/api/mcq/generate` | Generate MCQ quiz | ✅ |
| GET | `/api/youtube/search` | Search YouTube videos | ✅ |
| GET | `/api/youtube/recommended/:subject` | Recommended videos | ✅ |
| GET | `/api/youtube/languages` | Supported languages | ✅ |
| POST | `/api/youtube/save` | Save video to library | ✅ |
| POST | `/api/media/generate` | Generate study media | ✅ |
| GET | `/api/images/generate` | Generate AI image from prompt | ✅ |
| GET | `/api/images/styles` | List available image styles | ✅ |
| POST | `/api/images/save` | Save generated image | ✅ |
| GET | `/api/images/saved` | Get saved images | ✅ |
| DELETE | `/api/images/saved/:id` | Delete a saved image | ✅ |
| GET | `/api/admin/users` | List all users | ✅ Admin |

> **Auth** — Pass `Authorization: Bearer <token>` header for protected routes.

---

## 🌍 Supported Languages (YouTube Search)

English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Urdu, Spanish, French, German, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, Indonesian, Turkish, Vietnamese, Thai, Polish, Dutch, Italian, Swedish

---

## 🔒 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | ✅ | Backend server port (default: 5000) |
| `DB_HOST` | ✅ | MySQL host |
| `DB_PORT` | ✅ | MySQL port (default: 3306) |
| `DB_USER` | ✅ | MySQL username |
| `DB_PASSWORD` | ✅ | MySQL password |
| `DB_NAME` | ✅ | MySQL database name |
| `JWT_SECRET` | ✅ | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | ✅ | JWT expiry duration (e.g. `7d`) |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `YOUTUBE_API_KEY` | ✅ | YouTube Data API v3 key |
| `IMAGEKIT_URL_ENDPOINT` | ✅ | ImageKit URL endpoint for image generation |
| `FRONTEND_URL` | ✅ | CORS allowed origin |

---

## 📜 Scripts

| Command | Location | Description |
|---------|----------|-------------|
| `npm run dev` | `backend/` | Start backend in dev mode |
| `npm start` | `backend/` | Start backend in production |
| `npm run db:setup` | `backend/` | Run DB migrations/setup |
| `npm run dev` | `frontend/` | Start Vite dev server |
| `npm run build` | `frontend/` | Production build |

---

## 📝 License

ISC License — feel free to use and modify for educational purposes.

---

<div align="center">
  <p>Built with ❤️ for students everywhere</p>
  <p>🧞 <strong>Campus Genie</strong> — Your AI Study Companion</p>
</div>
