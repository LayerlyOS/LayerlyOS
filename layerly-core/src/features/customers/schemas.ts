import { z } from 'zod';

export const customerSchema = z.object({
  type: z.enum(['B2B', 'B2C']).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  tags: z.array(z.string()).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  phone: z.string().optional(),
  nip: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  assignedOrderIds: z.array(z.string()).optional(),
}).refine(data => data.firstName || data.lastName || data.companyName, {
  message: "You must provide a name or company name",
  path: ["companyName"],
});

export type CustomerFormData = z.infer<typeof customerSchema>;
