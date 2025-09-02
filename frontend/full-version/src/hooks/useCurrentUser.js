'use client';

import { useState, useEffect } from 'react';

// @project
import { supabase } from '@/utils/supabase/client';

/***************************  HOOKS - CONFIG  ***************************/

export default function useCurrentUser() {
  const [userData, setUserData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user) {
          setUserData(session.user);
        } else {
          setUserData(null);
        }
        setIsProcessing(false);
      } catch (error) {
        console.error('Session check error:', error);
        if (mounted) {
          setUserData(null);
          setIsProcessing(false);
        }
      }
    };

    checkSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        setUserData(session.user);
      } else {
        setUserData(null);
      }
      setIsProcessing(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUserData(session.user);
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      setUserData(null);
    }
  };

  return { userData, isProcessing, refreshUser };
}
