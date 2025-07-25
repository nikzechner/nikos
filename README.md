# Life OS - Personal Productivity Dashboard

A beautiful, modern productivity dashboard built with Next.js, Tailwind CSS, Framer Motion, and Supabase.

## Features

- 📅 **Smart Calendar** - Real-time clock and date navigation
- 🎯 **Goals Management** - Track long-term goals with progress
- 🔄 **Habit Tracker** - Build streaks with daily habit tracking
- ✅ **Task Management** - Priority tasks with beautiful animations
- 📝 **Quick Notes** - Apple Notes-style quick capture
- 📖 **Journal** - Daily mood tracking and reflection
- 🔐 **Authentication** - Secure login with Clerk
- 💾 **Database** - Persistent storage with Supabase

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables

⚠️ **SECURITY NOTE**: See `SECURITY.md` for complete security guidelines.

Create a `.env.local` file with:
```bash
# Client-side variables (exposed to browser - NO SECRETS!)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key

# Server-side variables (secure - safe for secrets)  
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CLERK_SECRET_KEY=your_clerk_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback
```

### 3. Set Up Database
See [DATABASE.md](./DATABASE.md) for database setup instructions.

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Animations**: Framer Motion
- **UI Components**: Shadcn UI
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS with custom gradients

## Project Structure

```
life-os/
├── src/
│   ├── app/           # Next.js app router
│   ├── components/    # UI components
│   └── lib/          # Utilities and database helpers
├── database-setup.sql # Complete database schema
├── database-test.sql  # Database testing script
└── DATABASE.md       # Database setup guide
```

## Development

- **Dashboard**: `/dashboard` - Main productivity dashboard
- **Database Test**: `/test-database` - Database connection test
- **Authentication**: Clerk handles sign-in/sign-up

## 🔒 Security

This application implements enterprise-level security measures:

- ✅ **Environment Variable Separation**: Client/server secrets properly isolated
- ✅ **Row-Level Security**: Database-level user data isolation  
- ✅ **API Authentication**: All routes protected with Clerk authentication
- ✅ **Secure Logging**: No sensitive data exposed in logs
- ✅ **Production Ready**: Security audit completed and issues resolved

**📚 See `SECURITY.md` for detailed security documentation and deployment guidelines.**

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [Supabase](https://supabase.com)
- [Clerk](https://clerk.com)
