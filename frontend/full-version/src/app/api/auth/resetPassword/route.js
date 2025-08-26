import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { accessToken, refreshToken, password } = body;

    if (!accessToken || !password) {
      return NextResponse.json({ error: 'Access token and password are required' }, { status: 400 });
    }

    // Create a Supabase client for this request
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Set the session first
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || ''
    });

    if (sessionError || !sessionData.session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Update the password
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      console.error('Reset password error:', error);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
