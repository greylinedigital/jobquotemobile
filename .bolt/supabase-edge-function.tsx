import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { job_description, client_email } = await req.json();
    // Simple AI-like quote generation logic
    // In a real app, you'd integrate with OpenAI or similar
    const generateQuoteItems = (description)=>{
      const items = [];
      const lowerDesc = description.toLowerCase();
      // Labour estimation based on keywords
      let labourHours = 2 // Base labour
      ;
      if (lowerDesc.includes('install') || lowerDesc.includes('installation')) labourHours += 2;
      if (lowerDesc.includes('wiring') || lowerDesc.includes('electrical')) labourHours += 1;
      if (lowerDesc.includes('ceiling fan')) labourHours += 1;
      if (lowerDesc.includes('power point')) {
        const matches = description.match(/(\d+)\s*(double\s*)?power\s*point/i);
        if (matches) {
          labourHours += parseInt(matches[1]) * 0.5;
        }
      }
      items.push({
        type: 'labour',
        name: 'Electrical Installation Labour',
        quantity: labourHours,
        unitPrice: 120
      });
      // Materials estimation
      if (lowerDesc.includes('power point')) {
        const matches = description.match(/(\d+)\s*(double\s*)?power\s*point/i);
        const quantity = matches ? parseInt(matches[1]) : 1;
        items.push({
          type: 'material',
          name: 'Double Power Point Outlet',
          quantity,
          unitPrice: 25
        });
      }
      if (lowerDesc.includes('ceiling fan')) {
        items.push({
          type: 'material',
          name: 'Ceiling Fan (Standard)',
          quantity: 1,
          unitPrice: 150
        });
      }
      if (lowerDesc.includes('wiring') || lowerDesc.includes('cable')) {
        items.push({
          type: 'material',
          name: 'Electrical Cable & Fittings',
          quantity: 1,
          unitPrice: 80
        });
      }
      // Safety check/testing
      items.push({
        type: 'labour',
        name: 'Safety Testing & Compliance Check',
        quantity: 1,
        unitPrice: 80
      });
      return items;
    };
    const lineItems = generateQuoteItems(job_description);
    // Generate a job title from the description
    const generateJobTitle = (desc)=>{
      if (desc.toLowerCase().includes('ceiling fan')) {
        return 'Ceiling Fan Installation';
      }
      if (desc.toLowerCase().includes('power point')) {
        return 'Power Point Installation';
      }
      if (desc.toLowerCase().includes('electrical')) {
        return 'Electrical Work';
      }
      return 'Electrical Services';
    };
    const response = {
      jobTitle: generateJobTitle(job_description),
      lineItems,
      clientEmail: client_email,
      notes: 'All work will be completed to Australian electrical standards and regulations.'
    };
    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
