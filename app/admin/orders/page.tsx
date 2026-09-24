import { Suspense } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import OrdersList from '@/components/admin/OrdersList';

export default function OrdersPage() {
  return (
    <AdminLayout>
      <Suspense>
        <OrdersList />
      </Suspense>
    </AdminLayout>
  );
}
