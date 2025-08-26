import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Create a Supabase client for this request
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Send magic link
    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://admin.everspeak.ai'}/auth/callback/success`
      }
    });

    if (magicLinkError) {
      console.error('Error sending magic link:', magicLinkError);

      // Handle rate limiting
      if (magicLinkError.message.includes('rate limit') || magicLinkError.message.includes('429')) {
        return NextResponse.json({ error: 'email rate limit exceeded' }, { status: 429 });
      }

      return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Magic link sent' });
  } catch (error) {
    console.error('Resend error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
