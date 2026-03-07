import { getCustomers, getUnassignedOrders } from '@/features/customers/actions';
import { CustomersManagement } from '@/features/customers/components/CustomersManagement';

interface CustomersPageProps {
  searchParams: Promise<{ new?: string; edit?: string }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const [customers, unassignedOrders] = await Promise.all([
    getCustomers(),
    getUnassignedOrders(),
  ]);

  const params = await searchParams;
  const initialOpenNew = params?.new === '1';
  const initialOpenEditId =
    typeof params?.edit === 'string' && params.edit.length > 0 ? params.edit : undefined;

  return (
    <CustomersManagement
      customers={customers}
      unassignedOrders={unassignedOrders}
      initialOpenNew={initialOpenNew}
      initialOpenEditId={initialOpenEditId}
    />
  );
}
