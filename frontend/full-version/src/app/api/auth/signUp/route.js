import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { firstname, lastname, dialcode, contact, email } = body;

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

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: Math.random().toString(36).slice(-10), // Generate a random password
      options: {
        data: {
          first_name: firstname,
          last_name: lastname,
          phone: dialcode + contact,
          full_name: `${firstname} ${lastname}`
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://admin.everspeak.ai'}/auth/callback/success`
      }
    });

    if (error) {
      console.error('Sign up error:', error);
      
      // Handle specific errors
      if (error.message.includes('User already registered')) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
      }
      
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return NextResponse.json({ error: 'email rate limit exceeded' }, { status: 429 });
      }
      
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Account created successfully' });

  } catch (error) {
    console.error('Sign up error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
