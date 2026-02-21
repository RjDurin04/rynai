# RynAI Chat

A full-stack AI chat application built with Next.js 16, powered by the Groq API. Features real-time streaming responses, multi-model support, voice input/output, image understanding, web search, and persistent conversation history.

---

## Features

- **Multi-model chat** — Switch between 15+ LLMs (Llama, GPT-OSS, Qwen, Kimi K2, Allam, Orpheus, and more) per conversation
- **Streaming responses** — Server-Sent Events (SSE) for real-time token-by-token output
- **Web search** — Groq Compound models perform live web searches and surface cited sources
- **Vision / image understanding** — Attach up to 4 images (PNG, JPEG, WebP, GIF, max 4 MB each) via file picker, paste, or drag-and-drop; routed to vision-capable models automatically
- **Voice input** — Record audio in-browser; transcribed via Whisper Large v3 Turbo
- **Text-to-speech** — Read any assistant message aloud via Orpheus v1 English (WAV)
- **Content safety** — Every user message is screened by Llama Guard 4 12B before being sent to the chat model
- **Persistent history** — Conversations and messages are stored in PostgreSQL via Prisma; lazy-loaded on demand
- **Authentication** — Email/password (with email verification) and Google OAuth via Better-Auth; session-cookie middleware protects all routes
- **Profile management** — Update display name, upload profile photo (via UploadThing), delete chat history, or delete account
- **Responsive UI** — Collapsible sidebar, mobile overlay drawer, animated transitions (Framer Motion), dark-mode-first design with Tailwind CSS v4

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui primitives |
| Animation | Framer Motion |
| AI / LLM | Groq SDK (chat, vision, web search, TTS, STT) |
| Auth | Better-Auth v1 (email+password, Google OAuth, email verification) |
| Database | PostgreSQL + Prisma 7 (pg adapter) |
| File uploads | UploadThing v7 |
| State | Zustand v5 |
| Email | EmailJS (verification & password reset) |
| Testing | Vitest |
| Linting | ESLint 9 |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Main chat page (client component)
│   ├── layout.tsx                  # Root layout (dark mode, Toaster)
│   ├── globals.css
│   ├── (auth)/                     # Auth route group
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── auth/check-email/
│   ├── actions/
│   │   └── auth.ts                 # Server Actions for auth
│   └── api/
│       ├── auth/[...all]/          # Better-Auth catch-all handler
│       ├── chat/                   # POST — streaming chat + web search
│       ├── audio/
│       │   ├── speech/             # POST — text-to-speech (Orpheus WAV)
│       │   └── transcription/      # POST — speech-to-text (Whisper)
│       ├── conversations/          # CRUD for conversations + messages
│       │   └── [id]/messages/
│       ├── account/conversations/  # DELETE all conversations (bulk)
│       └── uploadthing/            # UploadThing file router
├── components/
│   ├── chat/
│   │   ├── chat-layout.tsx         # Sidebar + main area shell
│   │   ├── chat-input.tsx          # Textarea, image attach, voice, model selector
│   │   ├── model-selector.tsx      # Animated model picker dropdown
│   │   ├── sidebar.tsx             # Conversation list, user profile, settings
│   │   ├── settings-dialog.tsx     # Profile, appearance, danger zone
│   │   ├── markdown-renderer.tsx   # react-markdown + syntax highlighting
│   │   └── error-banner.tsx        # Inline error display
│   ├── auth/
│   │   ├── auth-modal.tsx
│   │   ├── sign-in-form.tsx
│   │   └── sign-up-form.tsx
│   └── ui/                         # shadcn/ui primitives (Button, Dialog, etc.)
├── config/
│   ├── models.ts                   # Model IDs, defaults, vision model list
│   └── prompts.ts                  # System prompts
├── hooks/
│   └── use-send-message.ts         # Core send/stream/persist hook
├── lib/
│   ├── auth.ts                     # Better-Auth server config
│   ├── auth-client.ts              # Better-Auth client helpers
│   ├── db.ts                       # Prisma client singleton
│   ├── safety.ts                   # Llama Guard content moderation
│   ├── errors.ts                   # Connection error classifier
│   ├── api-utils.ts                # requireAuth, isApiError helpers
│   ├── uploadthing.ts              # UploadThing client
│   ├── utils.ts                    # cn() and misc utilities
│   └── api/
│       └── conversations.ts        # Typed fetch wrappers for conversation API
├── lib/store/
│   └── chat-store.ts               # Zustand store (conversations, messages, drafts)
└── types/
    └── chat.ts                     # Message, Conversation, ChatModel, etc.
prisma/
├── schema.prisma                   # User, Session, Account, Verification, Conversation, Message, ImageAttachment
└── migrations/
middleware.ts                       # Session-cookie auth guard (Next.js Middleware)
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL database
- Groq API key — [console.groq.com](https://console.groq.com)
- UploadThing account — [uploadthing.com](https://uploadthing.com)
- Google OAuth credentials (optional, for social login)
- EmailJS account (for email verification and password reset)

### 1. Clone and install

```bash
git clone <repo-url>
cd chatbot
npm install
```

### 2. Configure environment variables

Copy the provided `.env.example` file to create a `.env` file in the project root, and fill in your actual values:

```bash
cp .env.example .env
```

### 3. Set up the database

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest test suite |

---

## API Routes

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/chat` | Send a message; streams SSE for regular models, returns JSON for web-search models |
| `POST` | `/api/audio/speech` | Convert text to speech (WAV) via Orpheus v1 English |
| `POST` | `/api/audio/transcription` | Transcribe audio to text via Whisper Large v3 Turbo |
| `GET` | `/api/conversations` | List all conversations for the authenticated user |
| `POST` | `/api/conversations` | Create a new conversation |
| `GET` | `/api/conversations/[id]` | Get a single conversation |
| `PATCH` | `/api/conversations/[id]` | Update conversation (title, model, reasoning settings) |
| `DELETE` | `/api/conversations/[id]` | Delete a conversation |
| `GET` | `/api/conversations/[id]/messages` | List messages for a conversation |
| `POST` | `/api/conversations/[id]/messages` | Add a message to a conversation |
| `DELETE` | `/api/account/conversations` | Delete all conversations for the authenticated user |
| `*` | `/api/auth/[...all]` | Better-Auth handler (sign-in, sign-up, OAuth, session, etc.) |
| `*` | `/api/uploadthing` | UploadThing file upload handler |

All routes except `/api/auth/*` and `/api/uploadthing` require an authenticated session.

---

## Supported Models

| Model ID | Name | Capabilities |
|---|---|---|
| `llama-3.3-70b-versatile` | Llama 3.3 70B | Text (default) |
| `llama-3.1-8b-instant` | Llama 3.1 8B | Text (fast) |
| `meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout | Text + Vision |
| `meta-llama/llama-4-maverick-17b-128e-instruct` | Llama 4 Maverick | Text (128K context) |
| `openai/gpt-oss-120b` | GPT-OSS 120B | Text |
| `openai/gpt-oss-20b` | GPT-OSS 20B | Text |
| `openai/gpt-oss-safeguard-20b` | GPT-OSS Safeguard | Text (safety-focused) |
| `qwen/qwen3-32b` | Qwen 3 32B | Text (coding/math) |
| `moonshotai/kimi-k2-instruct` | Kimi K2 | Text |
| `moonshotai/kimi-k2-instruct-0905` | Kimi K2 (Sept) | Text |
| `allam-2-7b` | Allam 2 7B | Text (Arabic) |
| `canopylabs/orpheus-arabic-saudi` | Orpheus Arabic | Text (Arabic) |
| `canopylabs/orpheus-v1-english` | Orpheus English | Text |
| `groq/compound` | Compound Pro | Web search |
| `groq/compound-mini` | Compound Mini | Web search |

The model selector automatically filters available models based on whether images are attached or web search is enabled.

---

## Database Schema

```
User          — id, name, email, emailVerified, image
Session       — id, userId, token, expiresAt, ipAddress, userAgent
Account       — id, userId, accountId, providerId, accessToken, ...
Verification  — id, identifier, value, expiresAt
Conversation  — id, userId, title, model, reasoningEffort, reasoningFormat
Message       — id, conversationId, role, content
ImageAttachment — id, messageId, url, key, fileName, mimeType
```

Cascade deletes are configured throughout: deleting a user removes all their conversations, messages, and UploadThing image files.

---

## Authentication Flow

1. **Sign up** — email + password; verification email sent via EmailJS
2. **Email verification** — user clicks link; auto-signed in after verification
3. **Google OAuth** — one-click sign-in; accounts linked automatically if email matches
4. **Password reset** — forgot-password flow sends reset link via EmailJS
5. **Session guard** — `middleware.ts` checks for `better-auth.session_token` cookie on every non-public route; API routes return `401`, page routes redirect to `/login`

---

## Content Safety

Every user message is passed through **Llama Guard 4 12B** before reaching the chat model. If the message is flagged as unsafe, the API returns a `400` with the violation category. The safety check fails closed — if the guard model is unreachable, the message is blocked.

---

## Image Uploads

Images are uploaded to **UploadThing** (region: `sea1`) before being sent to the chat API. The UploadThing URL is stored in the `ImageAttachment` table and passed to vision models as `image_url` content parts. When a user's account is deleted, all associated UploadThing files are deleted via `UTApi.deleteFiles`.

---

## Deployment

The application is designed to deploy on **Vercel** with a managed PostgreSQL database (e.g., Vercel Postgres, Neon, or Supabase).

1. Push to GitHub and import the repository in Vercel
2. Set all environment variables in the Vercel dashboard
3. Run `npx prisma migrate deploy` against your production database
4. Deploy

For other platforms, ensure the Node.js runtime is 22+ and all environment variables are set.
