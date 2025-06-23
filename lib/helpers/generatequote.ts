// lib/helpers/generateQuote.ts
import { supabase } from '@/lib/supabase';

export async function generateQuote(job_description: string, client_email: string, user_id: string) {
  try {
    const res = await fetch('https://pofgpoktfwwrpkgzwuwa.supabase.co/functions/v1/generate-quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ job_description, client_email }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Quote generation failed');

    const { job_title, description, items, subtotal, gst, total } = data;

    // Create quote
    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .insert([
        {
          user_id,
          job_title,
          description,
          subtotal,
          gst_amount: gst,
          total,
          status: 'draft',
        },
      ])
      .select()
      .single();

    if (quoteError) throw quoteError;

    // Insert line items
    const quoteItems = items.map((item: any) => ({
      quote_id: quoteData.id,
      name: item.name,
      type: item.type,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    }));

    const { error: itemsError } = await supabase.from('quote_items').insert(quoteItems);

    if (itemsError) throw itemsError;

    return quoteData;
  } catch (error) {
    console.error('Error generating quote:', error);
    throw new Error('Failed to generate quote');
  }
}