# Authentication Setup Guide

## Environment Variables Required

Create a `.env.local` file in the `frontend/full-version` directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Service role key for admin operations (if needed)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Site URL for redirects (use port 3001 for local development)
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

## Supabase Project Configuration

**IMPORTANT**: You must configure your Supabase project settings:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Set **Site URL** to: `http://localhost:3001`
4. Add these URLs to **Redirect URLs**:
   - `http://localhost:3001/auth/callback/success`
   - `http://localhost:3001/auth/callback/handle-tokens`
   - `http://localhost:3001/admin/auth/callback`
   - `http://localhost:3001/password-recovery`

## How the Authentication Flow Works

1. **Login Process**:
   - User enters email on login page
   - System calls `/api/auth/check-email` to verify email exists and send magic link
   - User is redirected to OTP verification page
   - Magic link is sent to user's email

2. **Magic Link Authentication**:
   - User clicks magic link in email
   - Link redirects to `/auth/callback/success` (or `/auth/callback/handle-tokens` for URL hash tokens)
   - Success page handles authentication and redirects to dashboard
   - Uses implicit flow instead of PKCE for better compatibility

3. **Admin Authentication**:
   - Admin users with @everspeak.ai emails use the same callback URL
   - Success page automatically detects admin users and redirects to `/dashboard`
   - Regular users are redirected to `/dashboard/analytics`
   - Admin magic links use the same whitelisted callback URL to avoid spam filters

4. **Error Handling**:
   - All authentication errors are caught and displayed to user
   - Specific error messages for expired links, already used links, etc.
   - Rate limiting is handled gracefully

## API Routes Created

- `/api/auth/check-email` - Checks if email exists and sends magic link
- `/api/auth/resend` - Resends magic link
- `/api/auth/signUp` - User registration
- `/api/auth/getUser` - Get current user info
- `/api/auth/logout` - User logout
- `/api/auth/forgotPassword` - Password recovery
- `/api/auth/resetPassword` - Password reset

## Troubleshooting

### Magic Link Redirects to Wrong Domain

If your magic link redirects to `https://app.everspeak.ai` instead of localhost:

1. **Check Supabase Project Settings**: Ensure the Site URL and Redirect URLs are set correctly
2. **Use the Token Handler**: Navigate to `http://localhost:3001/auth/callback/handle-tokens` and paste the full URL with tokens
3. **Update Environment Variables**: Make sure `NEXT_PUBLIC_SITE_URL` is set to `http://localhost:3001`

### 400 Error on PKCE Token Exchange

If you see "Failed to load resource: the server responded with a status of 400":

1. Check that your Supabase environment variables are set correctly
2. Ensure your Supabase project has email authentication enabled
3. Verify that the redirect URLs are configured in your Supabase project settings
4. Check the browser console for more detailed error messages

## Testing the Authentication

1. Start the development server: `npm run dev` (runs on port 3001)
2. Navigate to `http://localhost:3001/login`
3. Enter a valid email address
4. Check your email for the magic link
5. Click the magic link to complete authentication

## Handling Production vs Development

For production deployment, update the environment variables:
- `NEXT_PUBLIC_SITE_URL=https://your-production-domain.com`
- Update Supabase redirect URLs to include your production domain
