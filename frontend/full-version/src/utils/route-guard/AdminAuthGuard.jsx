'use client';

import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import PageLoader from '@/components/PageLoader';
import { supabase } from '@/utils/supabase/client';
import { isAdminEmail } from '@/utils/adminAuth';

export default function AdminAuthGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isProcessing } = useAdminSession();

  useEffect(() => {
    if (isProcessing) return;

    if (!user || !isAdminEmail(user.email)) {
      const loginUrl = `/admin/login?redirect=${encodeURIComponent(pathname || '/dashboard')}`;
      router.replace(loginUrl);
    }
  }, [user, isProcessing, pathname, router]);

  if (isProcessing) return <PageLoader />;

  if (!user || !isAdminEmail(user.email)) return null;

  return children;
}

AdminAuthGuard.propTypes = { children: PropTypes.node };

function useAdminSession() {
  const [user, setUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let timeoutId;

    const resolveSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;

        const sessionUser = data?.session?.user;
        if (sessionUser && !error && isAdminEmail(sessionUser.email)) {
          setUser(sessionUser);
          setIsProcessing(false);
          setRetryCount(0);
          return;
        }

        if (sessionUser && !isAdminEmail(sessionUser.email)) {
          await supabase.auth.signOut();
          setUser(null);
          setIsProcessing(false);
          return;
        }

        if (retryCount < 2) {
          timeoutId = setTimeout(() => {
            if (mounted) setRetryCount((prev) => prev + 1);
          }, (retryCount + 1) * 400);
          return;
        }

        setUser(null);
        setIsProcessing(false);
      } catch (error) {
        console.error('[AdminAuthGuard] session error:', error);
        if (!mounted) return;
        if (retryCount < 2) {
          timeoutId = setTimeout(() => {
            if (mounted) setRetryCount((prev) => prev + 1);
          }, (retryCount + 1) * 400);
        } else {
          setUser(null);
          setIsProcessing(false);
        }
      }
    };

    resolveSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const sessionUser = session?.user;
      if (sessionUser && isAdminEmail(sessionUser.email)) {
        setUser(sessionUser);
        setIsProcessing(false);
        return;
      }

      if (event === 'SIGNED_OUT' || !sessionUser) {
        setUser(null);
        setIsProcessing(false);
        return;
      }

      if (sessionUser && !isAdminEmail(sessionUser.email)) {
        await supabase.auth.signOut();
        setUser(null);
        setIsProcessing(false);
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [retryCount]);

  return { user, isProcessing };
}
