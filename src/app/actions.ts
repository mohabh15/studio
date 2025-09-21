'use server';

import { scanReceipt, type ScanReceiptInput } from '@/ai/flows/scan-receipts';
import { z } from 'zod';

const ScanReceiptActionSchema = z.object({
  photoDataUri: z.string().refine(val => val.startsWith('data:image/'), {
    message: 'Invalid data URI for image.',
  }),
});

export async function scanReceiptAction(values: ScanReceiptInput) {
  try {
    const validatedFields = ScanReceiptActionSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: 'Invalid input.' };
    }
    const result = await scanReceipt(validatedFields.data);
    return { success: result };
  } catch (error) {
    console.error('Error in scanReceiptAction:', error);
    return { error: 'Failed to scan receipt. The AI model might be unavailable.' };
  }
}
