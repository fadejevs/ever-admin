'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

// @mui
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

// @project
import { supabase } from '@/utils/supabase/client';
import LogoSection from '@/components/logo';

const NAV_ITEMS = [
  { label: 'Ops', href: '/dashboard', match: (path) => path === '/dashboard' || path === '/dashboard/' },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    match: (path) => path.startsWith('/dashboard/analytics')
  }
];

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname() || '';
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };
    getUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserInitials = (email) => {
    if (!email) return 'A';
    return email.charAt(0).toUpperCase();
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: 1200,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: { xs: 2, sm: 3 }, gap: 2 }}>
        <Box sx={{ flexShrink: 0 }}>
          <LogoSection to="/dashboard" />
        </Box>

        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          sx={{ flexGrow: 1, minWidth: 0, ml: { xs: 1, sm: 2 } }}
        >
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                size="small"
                color={active ? 'primary' : 'inherit'}
                variant={active ? 'contained' : 'text'}
                sx={{
                  minWidth: 0,
                  px: 1.5,
                  py: 0.6,
                  borderRadius: 2,
                  fontWeight: active ? 700 : 600,
                  textTransform: 'none',
                  color: active ? undefined : 'text.secondary',
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 'none' }
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Stack>

        {user && (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                display: { xs: 'none', md: 'block' },
                maxWidth: 220,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {user.email}
            </Typography>

            <Button
              onClick={handleMenuClick}
              aria-label="Account menu"
              sx={{
                minWidth: 'auto',
                p: 0.5,
                borderRadius: '50%',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'grey.300',
                  color: 'grey.700',
                  fontSize: '0.875rem'
                }}
              >
                {getUserInitials(user.email)}
              </Avatar>
            </Button>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 200,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  borderRadius: 2
                }
              }}
            >
              <MenuItem onClick={handleLogout}>
                <ListItemText primary="Logout" />
              </MenuItem>
            </Menu>
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  );
}
