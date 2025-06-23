export async function POST(request: Request) {
  try {
    // Parse request body
    const requestBody = await request.text();
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
    } catch (parseError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { invoice } = parsedBody;

    // Validate required data
    if (!invoice || !invoice.quotes || !invoice.business_profile) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required invoice data',
          details: 'Invoice, quote, and business profile information are required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check for Resend API key
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Email service not configured',
          details: 'RESEND_API_KEY environment variable is missing. Please add your Resend API key to the environment variables.'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Import Resend dynamically
    let Resend;
    try {
      const resendModule = await import('resend');
      Resend = resendModule.Resend;
    } catch (importError) {
      return new Response(
        JSON.stringify({ 
          error: 'Email service unavailable',
          details: 'Resend package not available'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const resend = new Resend(resendApiKey);

    // Format invoice items for email
    const formatInvoiceItems = (items: any[]) => {
      if (!items || !Array.isArray(items)) return [];
      
      return items.map(item => {
        const quantity = item.quantity || item.qty || 1;
        const unitPrice = item.unit_price || item.cost || 0;
        const total = item.total || (quantity * unitPrice);
        const isLabour = item.type?.toLowerCase() === 'labour' || item.type?.toLowerCase() === 'labor';
        
        return {
          name: item.name || 'Unnamed Item',
          type: item.type || 'Other',
          quantity: quantity,
          unitPrice: unitPrice,
          total: total,
          isLabour: isLabour,
        };
      });
    };

    const formattedItems = formatInvoiceItems(invoice.quotes.quote_items || []);
    
    // Calculate totals
    const subtotal = invoice.quotes.subtotal || 0;
    const gstAmount = invoice.quotes.gst_amount || 0;
    const originalTotal = invoice.quotes.total || 0;
    const invoiceTotal = invoice.total || 0;
    const remainingBalance = originalTotal - invoiceTotal;
    const isPartialPayment = invoiceTotal < originalTotal;

    // Use verified sender email for testing
    const senderEmail = 'quote@jobquote.app';

    // Get payment method display name
    const getPaymentMethodName = (method: string) => {
      switch (method) {
        case 'bank_transfer': return 'Bank Transfer';
        case 'cash': return 'Cash Payment';
        case 'card': return 'Card Payment';
        default: return 'Bank Transfer';
      }
    };

    const paymentMethodName = getPaymentMethodName(invoice.payment_method || 'bank_transfer');

    // Create professional HTML email for invoice with dark grey theme and business branding
    const emailHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Invoice from ${invoice.business_profile.business_name || 'Professional Services'}</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #2d3748; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%); padding: 40px 24px; text-align: center; color: white; }
        .header-logo { width: 80px; height: 80px; border-radius: 12px; background: #ffffff; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; color: #2d3748; }
        .header h1 { color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 8px 0; }
        .header .abn { color: #e2e8f0; font-size: 14px; opacity: 0.9; margin: 0; }
        .content { padding: 32px 24px; }
        .greeting { color: #2d3748; font-size: 18px; margin-bottom: 16px; font-weight: 500; }
        .intro { color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px; }
        .invoice-header { background: #f7fafc; padding: 24px; border-radius: 12px; margin-bottom: 32px; border-left: 4px solid #2d3748; }
        .invoice-title { font-size: 24px; font-weight: bold; color: #2d3748; margin-bottom: 8px; }
        .invoice-number { color: #718096; font-size: 16px; margin-bottom: 8px; font-weight: 600; }
        .invoice-details { color: #4a5568; font-size: 14px; margin-bottom: 12px; }
        .job-description { color: #4a5568; font-size: 16px; line-height: 1.5; }
        .total-summary { text-align: center; background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%); color: white; padding: 32px; border-radius: 12px; margin-bottom: 32px; box-shadow: 0 4px 12px rgba(45, 55, 72, 0.3); }
        .total-amount { font-size: 42px; font-weight: bold; margin-bottom: 8px; }
        .total-label { font-size: 16px; opacity: 0.95; }
        .due-date { font-size: 14px; opacity: 0.9; margin-top: 8px; }
        .payment-method-badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; margin-top: 12px; display: inline-block; }
        .payment-method-text { font-size: 14px; font-weight: 600; }
        .balance-info { background: rgba(255,255,255,0.2); padding: 16px; border-radius: 8px; margin-top: 16px; }
        .balance-amount { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
        .items-section { margin-bottom: 32px; }
        .items-title { font-size: 20px; font-weight: bold; color: #2d3748; margin-bottom: 16px; }
        .items-table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .items-table th { padding: 16px 12px; text-align: left; font-size: 14px; font-weight: 600; color: #4a5568; background: #f7fafc; border-bottom: 1px solid #e2e8f0; }
        .items-table td { padding: 16px 12px; border-bottom: 1px solid #f0f0f0; }
        .items-table tr:last-child td { border-bottom: none; }
        .item-name { font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 15px; }
        .item-type { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; color: white; background: #718096; }
        .item-type.labour { background: #4299e1; }
        .item-type.materials { background: #48bb78; }
        .item-type.travel { background: #9f7aea; }
        .totals-section { background: #f7fafc; padding: 20px; border-radius: 12px; margin-bottom: 32px; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 16px; }
        .totals-row.final { font-weight: bold; font-size: 18px; color: #2d3748; border-top: 2px solid #e2e8f0; padding-top: 12px; margin-top: 12px; }
        .custom-message { background: #edf2f7; padding: 20px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid #2d3748; }
        .custom-message-text { color: #2d3748; font-size: 16px; line-height: 1.5; margin: 0; }
        .payment-section { background: #f7fafc; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
        .payment-title { font-size: 18px; font-weight: bold; color: #2d3748; margin-bottom: 16px; }
        .payment-details { color: #4a5568; font-size: 16px; line-height: 1.5; }
        .payment-table { width: 100%; margin-top: 12px; }
        .payment-table td { padding: 6px 0; font-size: 14px; }
        .payment-table .label { font-weight: 500; color: #4a5568; width: 30%; }
        .payment-table .value { font-weight: 600; color: #2d3748; }
        .footer { background: #f7fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer-text { color: #718096; font-size: 14px; line-height: 1.5; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        @media (max-width: 600px) {
            .container { margin: 0; }
            .content { padding: 24px 16px; }
            .header { padding: 32px 16px; }
            .total-amount { font-size: 36px; }
            .items-table th, .items-table td { padding: 12px 8px; font-size: 14px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${invoice.business_profile.logo_url ? 
              `<img src="${invoice.business_profile.logo_url}" alt="${invoice.business_profile.business_name}" style="width: 80px; height: 80px; border-radius: 12px; margin: 0 auto 16px; display: block; object-fit: cover;">` :
              `<div class="header-logo">${(invoice.business_profile.business_name || 'B').charAt(0)}</div>`
            }
            <h1>${invoice.business_profile.business_name || 'Professional Services'}</h1>
            ${invoice.business_profile.abn ? `<p class="abn">ABN: ${invoice.business_profile.abn}</p>` : ''}
        </div>

        <div class="content">
            <div class="greeting">Hi ${invoice.quotes.clients.name || 'Valued Customer'},</div>
            <div class="intro">
                ${isPartialPayment ? 
                  `Thank you for your deposit payment. Here's your invoice for the ${invoiceTotal < originalTotal ? 'remaining balance' : 'completed work'}. Payment is due by the specified date.` :
                  `Thank you for choosing our services. Please find your invoice below for the completed work. Payment is due by the specified date.`
                }
            </div>

            <div class="invoice-header">
                <div class="invoice-title">Invoice #${invoice.invoice_number}</div>
                <div class="invoice-number">For: ${invoice.quotes.job_title || 'Professional Service'}</div>
                <div class="invoice-details">Date: ${new Date(invoice.created_at).toLocaleDateString()}</div>
                <div class="invoice-details">Due: ${new Date(invoice.due_date).toLocaleDateString()}</div>
                <div class="job-description">${invoice.quotes.description || 'Professional service completed to the highest standards.'}</div>
            </div>

            <div class="total-summary">
                <div class="total-amount">$${invoiceTotal.toFixed(2)}</div>
                <div class="total-label">${isPartialPayment ? 'Amount Due' : 'Total Amount Due'}</div>
                <div class="due-date">Payment due by ${new Date(invoice.due_date).toLocaleDateString()}</div>
                <div class="payment-method-badge">
                    <span class="payment-method-text">Payment Method: ${paymentMethodName}</span>
                </div>
                ${isPartialPayment ? `
                <div class="balance-info">
                    <div class="balance-amount">Original Quote: $${originalTotal.toFixed(2)}</div>
                    <div>Deposit Paid: $${(originalTotal - invoiceTotal).toFixed(2)}</div>
                    <div>Remaining Balance: $${invoiceTotal.toFixed(2)}</div>
                </div>
                ` : ''}
            </div>

            ${invoice.custom_message ? `
            <div class="custom-message">
                <p class="custom-message-text">${invoice.custom_message}</p>
            </div>
            ` : ''}

            <div class="items-section">
                <div class="items-title">Invoice Details</div>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th class="text-center">Qty</th>
                            <th class="text-right">Rate</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${formattedItems.map(item => `
                            <tr>
                                <td>
                                    <div class="item-name">${item.name}</div>
                                    <span class="item-type ${item.type.toLowerCase()}">${item.type}</span>
                                </td>
                                <td class="text-center">${item.quantity}${item.isLabour ? ' hrs' : ''}</td>
                                <td class="text-right">$${item.unitPrice.toFixed(2)}${item.isLabour ? '/hr' : ''}</td>
                                <td class="text-right">$${item.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="totals-section">
                <div class="totals-row">
                    <span>Subtotal:</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                <div class="totals-row">
                    <span>GST (10%):</span>
                    <span>$${gstAmount.toFixed(2)}</span>
                </div>
                <div class="totals-row">
                    <span>Original Total:</span>
                    <span>$${originalTotal.toFixed(2)}</span>
                </div>
                ${isPartialPayment ? `
                <div class="totals-row">
                    <span>Deposit Paid:</span>
                    <span>-$${(originalTotal - invoiceTotal).toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="totals-row final">
                    <span>${isPartialPayment ? 'Balance Due:' : 'Total:'}</span>
                    <span>$${invoiceTotal.toFixed(2)}</span>
                </div>
            </div>

            ${invoice.payment_method === 'bank_transfer' && invoice.show_payment_details && invoice.business_profile.bank_name ? `
            <div class="payment-section">
                <div class="payment-title">Payment Instructions - Bank Transfer</div>
                <div class="payment-details">
                    Please transfer the ${isPartialPayment ? 'remaining balance' : 'total amount'} to the following account:
                    <table class="payment-table">
                        ${invoice.business_profile.bank_name ? `<tr><td class="label">Bank:</td><td class="value">${invoice.business_profile.bank_name}</td></tr>` : ''}
                        ${invoice.business_profile.bsb ? `<tr><td class="label">BSB:</td><td class="value">${invoice.business_profile.bsb}</td></tr>` : ''}
                        ${invoice.business_profile.account_number ? `<tr><td class="label">Account:</td><td class="value">${invoice.business_profile.account_number}</td></tr>` : ''}
                        ${invoice.business_profile.account_name ? `<tr><td class="label">Name:</td><td class="value">${invoice.business_profile.account_name}</td></tr>` : ''}
                        <tr><td class="label">Amount:</td><td class="value">$${invoiceTotal.toFixed(2)}</td></tr>
                        <tr><td class="label">Reference:</td><td class="value">${invoice.invoice_number}</td></tr>
                    </table>
                    <br><em>Please include the invoice number as your payment reference.</em>
                </div>
            </div>
            ` : ''}

            ${invoice.payment_method === 'cash' ? `
            <div class="payment-section">
                <div class="payment-title">Payment Instructions - Cash Payment</div>
                <div class="payment-details">
                    Payment can be made in cash upon completion of work or at our business premises. Please contact us to arrange payment collection.
                    <br><br>
                    <strong>Amount Due: $${invoiceTotal.toFixed(2)}</strong>
                    <br><br>
                    <strong>Cash Payment Benefits:</strong>
                    <ul>
                        <li>Immediate payment confirmation</li>
                        <li>No bank fees or processing delays</li>
                        <li>Receipt provided upon payment</li>
                    </ul>
                </div>
            </div>
            ` : ''}

            ${invoice.payment_method === 'card' ? `
            <div class="payment-section">
                <div class="payment-title">Payment Instructions - Card Payment</div>
                <div class="payment-details">
                    Card payments can be processed upon completion of work or by contacting us directly. We accept all major credit and debit cards.
                    <br><br>
                    <strong>Amount Due: $${invoiceTotal.toFixed(2)}</strong>
                    <br><br>
                    <strong>Accepted Cards:</strong>
                    <ul>
                        <li>Visa, Mastercard, American Express</li>
                        <li>Contactless and chip payments</li>
                        <li>Secure payment processing</li>
                    </ul>
                    <br>
                    Please contact us to arrange card payment processing.
                </div>
            </div>
            ` : ''}

            <div class="footer">
                <div class="footer-text">
                    Questions about this invoice? Contact us at ${invoice.business_profile.email || 'support@jobquote.app'}<br>
                    ${invoice.business_profile.phone ? `Phone: ${invoice.business_profile.phone}<br>` : ''}
                    <br>
                    <strong>${invoice.business_profile.business_name || 'Professional Services'}</strong><br>
                    ${invoice.business_profile.abn ? `ABN: ${invoice.business_profile.abn}<br>` : ''}
                    <br>
                    Professional invoicing service
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

    // Prepare email data
    const emailData = {
      from: senderEmail,
      to: [invoice.quotes.clients.email],
      subject: `Invoice #${invoice.invoice_number} from ${invoice.business_profile.business_name || 'Professional Services'} - ${paymentMethodName}`,
      html: emailHtml,
    };

    // Send email via Resend
    const emailResult = await resend.emails.send(emailData);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResult.data?.id,
        message: 'Invoice sent successfully',
        debug: {
          clientEmail: invoice.quotes.clients.email,
          businessName: invoice.business_profile.business_name,
          invoiceTotal: invoiceTotal,
          originalTotal: originalTotal,
          isPartialPayment: isPartialPayment,
          itemCount: formattedItems.length,
          paymentMethod: paymentMethodName,
          emailId: emailResult.data?.id,
          resendResponse: emailResult
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in send-invoice API:', error);
    
    let errorMessage = 'Failed to send invoice email';
    let errorDetails = 'Unknown error occurred';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      
      if (error.message.includes('API key')) {
        errorMessage = 'Invalid Resend API key';
        errorDetails = 'Please check your Resend API key configuration';
      } else if (error.message.includes('domain')) {
        errorMessage = 'Domain not verified';
        errorDetails = 'Please verify your sending domain in Resend dashboard, or use onboarding@resend.dev for testing';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded';
        errorDetails = 'Too many emails sent. Please try again later.';
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        debug: {
          errorType: error?.constructor?.name || 'Unknown',
          hasResendKey: !!process.env.RESEND_API_KEY,
          stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : undefined
        }
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}