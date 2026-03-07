'use server';

import { db } from '@/db';
import { customers, orders } from '@/db/schema';
import { getUser } from '@/lib/auth';
import { eq, inArray, isNull, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { customerSchema, type CustomerFormData } from './schemas';

export async function createCustomerWithOrders(data: CustomerFormData) {
  const user = await getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const validated = customerSchema.parse(data);

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Create Customer
      const [newCustomer] = await tx.insert(customers).values({
        userId: user.id,
        type: validated.type ?? null,
        firstName: validated.firstName,
        lastName: validated.lastName,
        companyName: validated.companyName,
        contactPerson: validated.contactPerson ?? null,
        status: validated.status ?? 'active',
        tags: validated.tags && validated.tags.length > 0 ? validated.tags : null,
        email: validated.email,
        phone: validated.phone,
        nip: validated.nip,
        street: validated.street,
        city: validated.city,
        zipCode: validated.zipCode,
        country: validated.country,
        notes: validated.notes,
      }).returning();

      // 2. Assign Orders
      if (validated.assignedOrderIds && validated.assignedOrderIds.length > 0) {
        await tx.update(orders)
          .set({ customerId: newCustomer.id })
          .where(
            and(
              inArray(orders.id, validated.assignedOrderIds),
              eq(orders.userId, user.id) // Security check
            )
          );
      }

      return newCustomer;
    });

    revalidatePath('/dashboard/customers');
    return { success: true, customerId: result.id };
  } catch (error) {
    console.error('Error creating customer:', error);
    return { success: false, error: 'Failed to create customer' };
  }
}

export async function getUnassignedOrders() {
  const user = await getUser();
  if (!user) {
    return [];
  }

  return await db.query.orders.findMany({
    where: and(
      eq(orders.userId, user.id),
      isNull(orders.customerId)
    ),
    columns: {
      id: true,
      title: true,
      customerName: true,
      createdAt: true,
      status: true,
    },
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
  });
}

export async function getCustomer(id: string) {
  const user = await getUser();
  if (!user) {
    return null;
  }

  return await db.query.customers.findFirst({
    where: and(
      eq(customers.id, id),
      eq(customers.userId, user.id)
    ),
    with: {
      orders: {
        columns: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          customerName: true,
        }
      }
    }
  });
}

export async function getCustomers() {
  const user = await getUser();
  if (!user) {
    return [];
  }

  return await db.query.customers.findMany({
    where: eq(customers.userId, user.id),
    orderBy: (customers, { desc }) => [desc(customers.createdAt)],
    with: {
      orders: {
        columns: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        }
      }
    }
  });
}

export async function updateCustomer(id: string, data: CustomerFormData) {
  const user = await getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const validated = customerSchema.parse(data);

  try {
    await db.transaction(async (tx) => {
      // 1. Update Customer
      await tx.update(customers)
        .set({
          type: validated.type ?? null,
          firstName: validated.firstName,
          lastName: validated.lastName,
          companyName: validated.companyName,
          contactPerson: validated.contactPerson ?? null,
          status: validated.status ?? 'active',
          tags: validated.tags && validated.tags.length > 0 ? validated.tags : null,
          email: validated.email,
          phone: validated.phone,
          nip: validated.nip,
          street: validated.street,
          city: validated.city,
          zipCode: validated.zipCode,
          country: validated.country,
          notes: validated.notes,
          updatedAt: new Date(),
        })
        .where(and(eq(customers.id, id), eq(customers.userId, user.id)));

      // 2. Manage Orders
      // First, unassign all orders for this customer (optional strategy, or just handle diffs)
      // Simpler strategy: 
      // - Unassign orders that are NOT in the new list but WERE in the old list (if we want to support unassigning).
      // - Assign orders that ARE in the new list.
      
      // However, the form only sends `assignedOrderIds`. 
      // If we assume `assignedOrderIds` contains ALL orders that should belong to this customer:
      
      // Get current orders
      const currentOrders = await tx.select({ id: orders.id }).from(orders).where(eq(orders.customerId, id));
      const currentOrderIds = currentOrders.map(o => o.id);
      
      const newOrderIds = validated.assignedOrderIds || [];
      
      // Orders to unassign (present in current, missing in new)
      const toUnassign = currentOrderIds.filter(oid => !newOrderIds.includes(oid));
      
      // Orders to assign (present in new, missing in current)
      const toAssign = newOrderIds.filter(oid => !currentOrderIds.includes(oid));

      if (toUnassign.length > 0) {
        await tx.update(orders)
          .set({ customerId: null })
          .where(and(
            inArray(orders.id, toUnassign),
            eq(orders.userId, user.id)
          ));
      }

      if (toAssign.length > 0) {
        await tx.update(orders)
          .set({ customerId: id })
          .where(and(
            inArray(orders.id, toAssign),
            eq(orders.userId, user.id)
          ));
      }
    });

    revalidatePath('/dashboard/customers');
    revalidatePath(`/dashboard/customers/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating customer:', error);
    return { success: false, error: 'Failed to update customer' };
  }
}

export async function deleteCustomer(id: string) {
  const user = await getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    // Check if customer exists and belongs to user
    const customer = await db.query.customers.findFirst({
      where: and(eq(customers.id, id), eq(customers.userId, user.id)),
    });

    if (!customer) {
      return { success: false, error: 'Customer not found' };
    }

    await db.transaction(async (tx) => {
      // Unassign orders first (set customerId to null)
      await tx.update(orders)
        .set({ customerId: null })
        .where(eq(orders.customerId, id));

      // Delete customer
      await tx.delete(customers)
        .where(eq(customers.id, id));
    });

    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error) {
    console.error('Error deleting customer:', error);
    return { success: false, error: 'Failed to delete customer' };
  }
}

