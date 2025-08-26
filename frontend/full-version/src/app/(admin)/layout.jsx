import PropTypes from 'prop-types';

// @mui
import Box from '@mui/material/Box';

// @project
import AdminAuthGuard from '@/utils/route-guard/AdminAuthGuard';
import AdminHeader from '@/components/AdminHeader';

export default function Layout({ children }) {
  return (
    <AdminAuthGuard>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AdminHeader />
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1,
            pt: 8, // Account for fixed header
            backgroundColor: 'background.default'
          }}
        >
          {children}
        </Box>
      </Box>
    </AdminAuthGuard>
  );
}

Layout.propTypes = { children: PropTypes.any };
