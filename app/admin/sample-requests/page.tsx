import { Suspense } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SampleRequestsList from '@/components/admin/SampleRequestsList';

export default function SampleRequestsPage() {
  return (
    <AdminLayout>
      <Suspense>
        <SampleRequestsList />
      </Suspense>
    </AdminLayout>
  );
}
