# Chatbot

A full-stack AI chat application built with Next.js 16, featuring real-time streaming responses, multi-modal inputs, voice I/O, web search, and persistent conversation history.

---

## Features

### Core Chat
- **Streaming responses** via Server-Sent Events (SSE) for real-time token delivery
- **Multi-model support** — switch between 15+ LLMs from a single interface
- **Conversation history** — persisted to PostgreSQL, loaded on demand
- **Message editing** — edit any past user message and regenerate from that point
- **Copy & regenerate** — copy any response or re-run the last assistant turn
- **Auto-title generation** — conversation titles are derived from the first message

### Multi-Modal
- **Image uploads** — attach up to 4 images per message (max 4 MB each) via UploadThing
- **Vision models** — images are sent as multi-modal content to compatible models; non-vision models receive text only
- **Automatic model switching** — selecting an image auto-switches to a vision-capable model and reverts when images are removed

### Voice
- **Speech-to-text** — record audio directly in the browser; transcribed via Groq Whisper (`whisper-large-v3-turbo`)
- **Text-to-speech** — any assistant message can be read aloud using Groq's Orpheus TTS model (`canopylabs/orpheus-v1-english`)

### Web Search
- **Compound models** — toggle web search to route queries through Groq's `compound-mini` or `compound` models, which return cited search results alongside the answer
- **Search result cards** — sources are rendered inline below the response

### Authentication
- **Email/password** with mandatory email verification
- **Google OAuth** via Better-Auth social providers
- **Password reset** via email (EmailJS)
- **Account linking** — sign in with Google on an existing email/password account
- **Account deletion** — cascades to all conversations, messages, and uploaded images

### Safety
- Every user message is screened by **Llama Guard 4 12B** before being forwarded to the chat model; unsafe content is blocked with a reason code

### Rate Limiting
- Chat: **20 requests / minute** per user (Upstash Redis sliding window)
- Audio: **10 requests / minute** per user
- Gracefully degrades to no-op when Redis is not configured

### Settings
- Update display name and profile picture
- Delete all chat history (with confirmation)
- Delete account (with confirmation, cleans up all remote assets)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui + Radix UI primitives |
| Animation | Framer Motion |
| Icons | Lucide React |
| AI / LLM | Groq SDK |
| Auth | Better-Auth v1 |
| Database | PostgreSQL via Prisma 7 + `@prisma/adapter-pg` |
| File Uploads | UploadThing |
| Rate Limiting | Upstash Ratelimit + Upstash Redis |
| Email | EmailJS |
| State | Zustand |
| Validation | Zod |
| Testing | Vitest |
| Linting | ESLint (Next.js config) |

---

## Supported Models

| Model ID | Name | Capabilities |
|---|---|---|
| `llama-3.3-70b-versatile` | Llama 3.3 70B | Text |
| `llama-3.1-8b-instant` | Llama 3.1 8B | Text |
| `meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout | Text + Vision |
| `meta-llama/llama-4-maverick-17b-128e-instruct` | Llama 4 Maverick | Text (128K context) |
| `openai/gpt-oss-120b` | GPT-OSS 120B | Text |
| `openai/gpt-oss-20b` | GPT-OSS 20B | Text |
| `openai/gpt-oss-safeguard-20b` | GPT-OSS Safeguard | Text |
| `qwen/qwen3-32b` | Qwen 3 32B | Text |
| `moonshotai/kimi-k2-instruct` | Kimi K2 | Text |
| `moonshotai/kimi-k2-instruct-0905` | Kimi K2 (Sept) | Text |
| `allam-2-7b` | Allam 2 7B | Text (Arabic) |
| `canopylabs/orpheus-arabic-saudi` | Orpheus Arabic | Text (Arabic) |
| `canopylabs/orpheus-v1-english` | Orpheus English | Text |
| `groq/compound-mini` | Compound Mini | Web Search |
| `groq/compound` | Compound Pro | Web Search |

All models are served through the Groq API.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Auth route group (login, signup, forgot/reset password)
│   ├── actions/auth.ts          # Server Actions for auth flows
│   ├── api/
│   │   ├── auth/[...all]/       # Better-Auth catch-all handler
│   │   ├── chat/                # Main chat endpoint (streaming + web search)
│   │   ├── audio/
│   │   │   ├── speech/          # Text-to-speech (Groq Orpheus)
│   │   │   └── transcription/   # Speech-to-text (Groq Whisper)
│   │   ├── conversations/       # CRUD for conversations and messages
│   │   ├── account/conversations/ # Account-scoped conversation list
│   │   └── uploadthing/         # UploadThing file router
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # Main chat page
├── components/
│   ├── auth/                    # Sign-in and sign-up forms, auth modal
│   ├── chat/
│   │   ├── chat-input.tsx       # Message composer (text, images, voice, web search toggle)
│   │   ├── chat-layout.tsx      # Shell with sidebar
│   │   ├── error-banner.tsx     # Connection/error display
│   │   ├── markdown-renderer.tsx # Syntax-highlighted markdown
│   │   ├── model-selector.tsx   # Model picker with capability filtering
│   │   ├── settings-dialog.tsx  # Profile, chat history, account deletion
│   │   └── sidebar.tsx          # Conversation list and navigation
│   └── ui/                      # shadcn/ui primitives
├── config/
│   ├── models.ts                # Model IDs, defaults, vision model list
│   └── prompts.ts               # System prompts
├── hooks/
│   └── use-send-message.ts      # Core send/stream/abort/persist logic
├── lib/
│   ├── api/conversations.ts     # Client-side API helpers
│   ├── store/chat-store.ts      # Zustand store (conversations, messages)
│   ├── validators/              # Zod schemas for API inputs
│   ├── auth.ts                  # Better-Auth server config
│   ├── auth-client.ts           # Better-Auth client
│   ├── db.ts                    # Prisma client singleton
│   ├── errors.ts                # Error type helpers
│   ├── rate-limit.ts            # Upstash rate limiters
│   ├── safety.ts                # Llama Guard content moderation
│   ├── uploadthing.ts           # UploadThing client helpers
│   └── utils.ts                 # cn() utility
└── types/
    └── chat.ts                  # Shared TypeScript types
```

---

## Database Schema

```
User ──< Session
     ──< Account
     ──< Conversation ──< Message ──< ImageAttachment
Verification
```

- **User** — email, name, avatar, email-verified flag
- **Session / Account / Verification** — managed by Better-Auth
- **Conversation** — belongs to a user; stores selected model and reasoning settings
- **Message** — role (`user` | `assistant`), text content, timestamp
- **ImageAttachment** — UploadThing URL + key, linked to a message

---

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL database
- Groq API key
- UploadThing account
- Upstash Redis instance (optional — rate limiting is disabled without it)
- EmailJS account (for email verification and password reset)
- Google OAuth credentials (optional — for social login)

### Installation

```bash
git clone <repo-url>
cd chatbot
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Groq
GROQ_API_KEY="gsk_..."

# Better-Auth
BETTER_AUTH_SECRET="your-secret-here"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET_KEY="..."

# EmailJS
EMAILJS_SERVICE_ID="..."
EMAILJS_PUBLIC_KEY="..."
EMAILJS_PRIVATE_KEY="..."
EMAILJS_TEMPLATE_ID_VERIFY="..."
EMAILJS_TEMPLATE_ID_RESET="..."

# UploadThing
UPLOADTHING_TOKEN="..."

# Upstash Redis (optional — disables rate limiting if absent)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### Database Setup

```bash
npx prisma migrate deploy
```

### Development

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build   # runs prisma generate + migrate deploy + next build
npm start
```

---

## API Reference

### `POST /api/chat`
Streams an AI response. Requires authentication.

**Request body:**
```json
{
  "messages": [{ "role": "user", "content": "Hello", "images": [] }],
  "model": "llama-3.3-70b-versatile",
  "webSearch": false
}
```

**Response:** `text/event-stream` — chunks of `data: {"content":"..."}` terminated by `data: [DONE]`.  
Web search models return a JSON object `{ content, searchResults }` instead of a stream.

---

### `POST /api/audio/transcription`
Transcribes an audio file. Requires authentication.

**Request:** `multipart/form-data` with a `file` field (flac, m4a, mp3, mp4, ogg, wav, webm).

**Response:** `{ "text": "transcribed text" }`

---

### `POST /api/audio/speech`
Generates speech from text. Requires authentication.

**Request body:** `{ "text": "...", "voice": "en-US-JennyNeural" }`

**Response:** `audio/wav` binary stream.

---

### `GET /api/conversations`
Returns the authenticated user's conversation list (without messages).

### `POST /api/conversations`
Creates a new conversation.

### `GET /api/conversations/:id/messages`
Returns all messages for a conversation (lazy-loaded).

### `PATCH /api/conversations/:id`
Updates conversation title or model.

### `DELETE /api/conversations/:id`
Deletes a conversation and all its messages and image attachments.

---

## Testing

```bash
npm test
```

Tests are located in `tests/` and mirror the `src/` structure. The suite uses Vitest.

---

## Security

- All API routes (except auth and UploadThing callbacks) require a valid Better-Auth session cookie, enforced at the middleware layer.
- Every user message is screened by Llama Guard 4 before reaching the chat model.
- Rate limiting is applied per-user via Upstash Redis sliding windows.
- Account deletion cascades to all user data including remote UploadThing assets.
- Email verification is required before a new account can sign in.
