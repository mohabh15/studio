// Scans receipts using the device's camera, extracting the amount, date, and merchant name.

'use server';

/**
 * @fileOverview An AI agent for scanning receipts and extracting relevant information.
 *
 * - scanReceipt - A function that handles the receipt scanning process.
 * - ScanReceiptInput - The input type for the scanReceipt function.
 * - ScanReceiptOutput - The return type for the scanReceipt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScanReceiptInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected the expected format description
    ),
});
export type ScanReceiptInput = z.infer<typeof ScanReceiptInputSchema>;

const ScanReceiptOutputSchema = z.object({
  amount: z.string().describe('The total amount on the receipt.'),
  date: z.string().describe('The date on the receipt (YYYY-MM-DD).'),
  merchantName: z.string().describe('The name of the merchant.'),
});
export type ScanReceiptOutput = z.infer<typeof ScanReceiptOutputSchema>;

export async function scanReceipt(input: ScanReceiptInput): Promise<ScanReceiptOutput> {
  return scanReceiptFlow(input);
}

const scanReceiptPrompt = ai.definePrompt({
  name: 'scanReceiptPrompt',
  input: {schema: ScanReceiptInputSchema},
  output: {schema: ScanReceiptOutputSchema},
  prompt: `You are an expert receipt scanner. Extract the total amount, date, and merchant name from the receipt image.  The date should be returned in YYYY-MM-DD format.

Receipt Image: {{media url=photoDataUri}}`,
});

const scanReceiptFlow = ai.defineFlow(
  {
    name: 'scanReceiptFlow',
    inputSchema: ScanReceiptInputSchema,
    outputSchema: ScanReceiptOutputSchema,
  },
  async input => {
    const {output} = await scanReceiptPrompt(input);
    return output!;
  }
);
