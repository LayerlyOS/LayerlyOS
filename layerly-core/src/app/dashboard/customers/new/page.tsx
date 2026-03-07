import { redirect } from 'next/navigation';

export default function NewCustomerPage() {
  redirect('/dashboard/customers?new=1');
}
