import { redirect } from 'next/navigation';

interface EditCustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params;
  redirect(`/dashboard/customers?edit=${encodeURIComponent(id)}`);
}
