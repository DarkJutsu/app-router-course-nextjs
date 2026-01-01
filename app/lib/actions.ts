'use server';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import { z } from 'zod';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

const sql = postgres(process.env.POSTGRES_URL_NON_POOLING!, { ssl: 'require' });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  /* Validate form using Zod */
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  /* Si falla la validación del formulario, se devuelven los errores con antelación. De lo contrario, se continúa. */
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  /* Prepare data for insertion into the database */
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    /* Insert data into the database */
    await sql`
      insert into invoices(customer_id, amount, status, date)
      values(${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    /* Si ocurre un error en la base de datos, devuelve un error más específico. */
    console.error('Error creating invoice:', error);
    return { message: 'Database Error: Failed to Create Invoice.' };
  }

  /* Revalidar el caché de la página de facturas y redirigir al usuario. */
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  /* Si falla la validación del formulario, se devuelven los errores con antelación. De lo contrario, se continúa. */
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  /* Prepare data for insertion into the database */
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
      update invoices
      set customer_id = ${customerId},
        amount = ${amountInCents},
        status = ${status}
      where id = ${id}
    `;
  } catch (error) {
    console.error('Error update Invoice:', error);
    return { message: 'Database Error: Failed to Update Invoice' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  throw new Error('Failed to Delete Invoice');
  await sql`
  delete from invoices
  where id = ${id}
  `;
  revalidatePath('/dashboard/invoices');
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials';
        default:
          return 'Something went wrong';
      }
    }
    throw error;
  }
}
