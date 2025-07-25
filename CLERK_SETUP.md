# Clerk Authentication Setup Guide

This guide will help you set up Clerk authentication for your Life OS dashboard.

## 1. Create a Clerk Application

1. Go to [clerk.com](https://clerk.com) and sign up/login
2. Create a new application
3. Choose "Next.js" as your framework
4. Select "App Router" as your routing system

## 2. Get Your Clerk Credentials

1. In your Clerk dashboard, go to **API Keys**
2. Copy your **Publishable Key** and **Secret Key**
3. Create a `.env.local` file in your project root with:

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Optional: Custom URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## 3. Configure Your Application

The following files have already been set up for you:

### ✅ Middleware (`src/middleware.ts`)
- Uses `clerkMiddleware()` from `@clerk/nextjs/server`
- Protects all routes except static files
- Handles authentication automatically

### ✅ Layout (`src/app/layout.tsx`)
- Wrapped with `<ClerkProvider>`
- Includes authentication UI components
- Responsive header with sign-in/sign-up buttons

### ✅ Dashboard Protection (`src/app/dashboard/page.tsx`)
- Protected with `<SignedIn>` component
- Redirects unauthenticated users to sign-in
- Full dashboard functionality for authenticated users

### ✅ Home Page (`src/app/page.tsx`)
- Shows different content for signed-in vs signed-out users
- Beautiful landing page for new users
- Automatic redirect for authenticated users

## 4. Available Components

The following Clerk components are available throughout your app:

### Authentication Components
- `<SignInButton>` - Opens sign-in modal
- `<SignUpButton>` - Opens sign-up modal
- `<UserButton>` - User profile dropdown
- `<SignedIn>` - Shows content only to authenticated users
- `<SignedOut>` - Shows content only to unauthenticated users

### Server-Side Functions
- `auth()` - Get current user in server components
- `currentUser()` - Get current user in client components
- `clerkMiddleware()` - Protect routes in middleware

## 5. Customization Options

### Custom Sign-In/Sign-Up Pages
Create custom pages at:
- `src/app/sign-in/[[...sign-in]]/page.tsx`
- `src/app/sign-up/[[...sign-up]]/page.tsx`

### User Profile
Access user data in components:
```typescript
import { useUser } from "@clerk/nextjs";

function MyComponent() {
  const { user } = useUser();
  return <div>Hello, {user?.firstName}!</div>;
}
```

### Server-Side Authentication
```typescript
import { auth } from "@clerk/nextjs/server";

export default async function ServerComponent() {
  const { userId } = auth();
  // Your server-side logic here
}
```

## 6. Testing Your Setup

1. **Start your development server**: `npm run dev`
2. **Visit your app**: `http://localhost:3000`
3. **Test sign-up**: Click "Sign Up" and create an account
4. **Test sign-in**: Sign out and sign back in
5. **Test protected routes**: Visit `/dashboard` (should redirect if not signed in)

## 7. Environment Variables

Make sure your `.env.local` file contains:

```env
# Required
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional - Custom URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## 8. Troubleshooting

### Common Issues:

1. **"Missing environment variables"**: Check your `.env.local` file
2. **Middleware not working**: Ensure `middleware.ts` is in the correct location
3. **Authentication not persisting**: Check browser cookies and local storage
4. **Redirect loops**: Verify your Clerk dashboard URLs match your app URLs

### Debug Steps:

1. Check browser console for errors
2. Verify environment variables are loaded
3. Test with a fresh browser session
4. Check Clerk dashboard for configuration issues

## 9. Next Steps

1. Add your Clerk environment variables to `.env.local`
2. Test the authentication flow
3. Customize the UI components as needed
4. Integrate with your Supabase backend for user data
5. Add user profile management features

Your Clerk authentication is now fully configured and ready to use! 🎉 