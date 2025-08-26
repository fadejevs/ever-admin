import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Create a Supabase client for this request
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Send magic link using signInWithOtp (this doesn't require PKCE)
    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://admin.everspeak.ai'}/auth/callback/success`
      }
    });

    if (magicLinkError) {
      console.error('Error sending magic link:', magicLinkError);
      
      // If the error indicates the user doesn't exist, return that
      if (magicLinkError.message.includes('User not found') || 
          magicLinkError.message.includes('Email not confirmed')) {
        return NextResponse.json({ exists: false, error: 'No account found with this email' });
      }
      
      // Handle rate limiting
      if (magicLinkError.message.includes('rate limit') || magicLinkError.message.includes('429')) {
        return NextResponse.json({ error: 'email rate limit exceeded' }, { status: 429 });
      }
      
      return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 });
    }

    return NextResponse.json({ exists: true, message: 'Magic link sent' });

  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
