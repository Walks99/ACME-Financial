'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache'; // This will allow us to clear the cache for the invoices page and trigger a new request to the server when an invoice is added.
import { redirect } from 'next/navigation'; // This will allow us to redirect the user back to the invoices page after the invoice has been created and submitted to the database.
 
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});
 
// ------------------------------------------------------------
const CreateInvoice = FormSchema.omit({ id: true, date: true });
 
export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100; // convert to cents
  const date = new Date().toISOString().split('T')[0]; // Set the invoice's creation date

  try {
      // Insert the new invoice into the database
  await sql`
  INSERT INTO invoices (customer_id, amount, status, date)
  VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
`;
  } catch (error) {
    return {
        message: 'Database Error: Failed to Create Invoice.',
    };
  }

revalidatePath('/dashboard/invoices'); // Clear the cache for the invoices page a fetch the fresh data from the server once the database has been updated with the new invoice.
redirect('/dashboard/invoices'); // Redirect the user back to the invoices page after the invoice has been created and submitted to the database.
}
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^


// ------------------------------------------------------------
// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
// ...
 
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  const amountInCents = amount * 100;
 
  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
  } catch (error) {
    return {
        messge: 'Database Error: Failed to Update Invoice.',
    }
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

// ------------------------------------------------------------
export async function deleteInvoice(id: string) {
    throw new Error('Failed to Delete Invoice');
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
        revalidatePath('/dashboard/invoices');
        return {
            message: 'Invoice Deleted.'
        }
    } catch (error) {
        return {
            message: 'Database Error: Failed to Delete Invoice.'
        }
    }
  }
  // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^