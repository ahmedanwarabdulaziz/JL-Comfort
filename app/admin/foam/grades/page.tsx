'use client';

import { useAuth } from '@/lib/auth/utils';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminLayout from '@/components/admin/AdminLayout';
import FoamGradesList from '@/components/admin/FoamGradesList';
import { Box, CircularProgress } from '@mui/material';

export default function FoamGradesPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  return (
    <AdminLayout>
      <FoamGradesList />
    </AdminLayout>
  );
}
