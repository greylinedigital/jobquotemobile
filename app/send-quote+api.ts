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

    const { quote } = parsedBody;

    // Validate required data
    if (!quote || !quote.clients || !quote.business_profile) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required quote data',
          details: 'Quote, client, and business profile information are required'
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

    // Format quote items for email
    const formatQuoteItems = (items: any[]) => {
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

    const formattedItems = formatQuoteItems(quote.quote_items || []);
    
    // Calculate totals
    const subtotal = quote.subtotal || 0;
    const gstAmount = quote.gst_amount || 0;
    const total = quote.total || 0;
    const downpaymentAmount = quote.downpayment_requested ? (quote.downpayment_amount || 0) : 0;

    // Use verified sender email for testing - this domain is pre-verified by Resend
    const senderEmail = 'quote@jobquote.app';

    // Generate unique approval link (in production, this would be a proper URL)
    const approvalLink = `https://jobquote.app/quote-approval/${quote.id}`;

    // Create professional HTML email with dark grey theme and business branding
    const emailHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Quote from ${quote.business_profile.business_name || 'Professional Services'}</title>
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
        .quote-header { background: #f7fafc; padding: 24px; border-radius: 12px; margin-bottom: 32px; border-left: 4px solid #2d3748; }
        .quote-title { font-size: 24px; font-weight: bold; color: #2d3748; margin-bottom: 8px; }
        .quote-number { color: #718096; font-size: 14px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .quote-description { color: #4a5568; font-size: 16px; line-height: 1.5; }
        .total-summary { text-align: center; background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%); color: white; padding: 32px; border-radius: 12px; margin-bottom: 32px; box-shadow: 0 4px 12px rgba(45, 55, 72, 0.3); }
        .total-amount { font-size: 42px; font-weight: bold; margin-bottom: 8px; }
        .total-label { font-size: 16px; opacity: 0.95; }
        .downpayment-info { background: rgba(255,255,255,0.2); padding: 16px; border-radius: 8px; margin-top: 16px; }
        .downpayment-amount { font-size: 24px; font-weight: bold; margin-bottom: 4px; }
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
        .action-section { background: #edf2f7; padding: 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; }
        .action-title { font-size: 20px; font-weight: bold; color: #2d3748; margin-bottom: 16px; }
        .action-buttons { display: flex; gap: 12px; justify-content: center; margin-bottom: 16px; }
        .btn { display: inline-block; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center; }
        .btn-approve { background: #48bb78; color: white; }
        .btn-changes { background: #718096; color: white; }
        .action-note { font-size: 14px; color: #4a5568; font-style: italic; }
        .payment-section { background: #f7fafc; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
        .payment-title { font-size: 18px; font-weight: bold; color: #2d3748; margin-bottom: 16px; }
        .payment-details { color: #4a5568; font-size: 16px; line-height: 1.5; }
        .payment-table { width: 100%; margin-top: 12px; }
        .payment-table td { padding: 6px 0; font-size: 14px; }
        .payment-table .label { font-weight: 500; color: #4a5568; width: 30%; }
        .payment-table .value { font-weight: 600; color: #2d3748; }
        .contact-section { background: #f7fafc; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px; }
        .contact-title { font-size: 18px; font-weight: bold; color: #2d3748; margin-bottom: 12px; }
        .contact-info { color: #4a5568; font-size: 16px; line-height: 1.5; }
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
            .action-buttons { flex-direction: column; }
            .btn { margin-bottom: 8px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${quote.business_profile.logo_url ? 
              `<img src="${quote.business_profile.logo_url}" alt="${quote.business_profile.business_name}" style="width: 80px; height: 80px; border-radius: 12px; margin: 0 auto 16px; display: block; object-fit: cover;">` :
              `<div class="header-logo">${(quote.business_profile.business_name || 'B').charAt(0)}</div>`
            }
            <h1>${quote.business_profile.business_name || 'Professional Services'}</h1>
            ${quote.business_profile.abn ? `<p class="abn">ABN: ${quote.business_profile.abn}</p>` : ''}
        </div>

        <div class="content">
            <div class="greeting">Hi ${quote.clients.name || 'Valued Customer'},</div>
            <div class="intro">
                Thank you for your interest in our services. We're pleased to provide you with a detailed quote for your project. Please review the information below and let us know your decision.
            </div>

            <div class="quote-header">
                <div class="quote-title">${quote.job_title || 'Professional Service'}</div>
                <div class="quote-number">Quote #${quote.id.slice(-6).toUpperCase()}</div>
                <div class="quote-description">${quote.description || 'Professional service quote for your project.'}</div>
            </div>

            <div class="total-summary">
                <div class="total-amount">$${total.toFixed(2)}</div>
                <div class="total-label">Total including GST</div>
                ${downpaymentAmount > 0 ? `
                <div class="downpayment-info">
                    <div class="downpayment-amount">$${downpaymentAmount.toFixed(2)} deposit required</div>
                    <div>Remaining balance: $${(total - downpaymentAmount).toFixed(2)}</div>
                </div>
                ` : ''}
            </div>

            <!-- Action Buttons -->
            <div class="action-section">
                <div class="action-title">Ready to proceed?</div>
                <div class="action-buttons">
                    <a href="${approvalLink}?action=approve" class="btn btn-approve">✓ Approve Quote</a>
                    <a href="mailto:${quote.business_profile.email}?subject=Changes%20Required%20-%20Quote%20${quote.id.slice(-6).toUpperCase()}" class="btn btn-changes">Request Changes</a>
                </div>
                <div class="action-note">Click "Approve Quote" to accept this quote and begin work, or "Request Changes" to discuss modifications.</div>
            </div>

            <div class="items-section">
                <div class="items-title">Quote Breakdown</div>
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
                <div class="totals-row final">
                    <span>Total:</span>
                    <span>$${total.toFixed(2)}</span>
                </div>
            </div>

            ${downpaymentAmount > 0 && quote.business_profile.bank_name ? `
            <div class="payment-section">
                <div class="payment-title">Deposit Payment Details</div>
                <div class="payment-details">
                    To secure your booking, please transfer the deposit amount to:
                    <table class="payment-table">
                        ${quote.business_profile.bank_name ? `<tr><td class="label">Bank:</td><td class="value">${quote.business_profile.bank_name}</td></tr>` : ''}
                        ${quote.business_profile.bsb ? `<tr><td class="label">BSB:</td><td class="value">${quote.business_profile.bsb}</td></tr>` : ''}
                        ${quote.business_profile.account_number ? `<tr><td class="label">Account:</td><td class="value">${quote.business_profile.account_number}</td></tr>` : ''}
                        ${quote.business_profile.account_name ? `<tr><td class="label">Name:</td><td class="value">${quote.business_profile.account_name}</td></tr>` : ''}
                        <tr><td class="label">Amount:</td><td class="value">$${downpaymentAmount.toFixed(2)}</td></tr>
                        <tr><td class="label">Reference:</td><td class="value">DEPOSIT-${quote.id.slice(-6).toUpperCase()}</td></tr>
                    </table>
                    <br><em>Please include the reference number with your payment.</em>
                </div>
            </div>
            ` : ''}

            <!-- Payment Terms -->
            ${quote.business_profile.payment_terms ? `
            <div class="payment-section">
                <div class="payment-title">Payment Terms</div>
                <div class="payment-details">${quote.business_profile.payment_terms}</div>
            </div>
            ` : ''}

            <div class="contact-section">
                <div class="contact-title">Questions about this quote?</div>
                <div class="contact-info">
                    Contact us at <a href="mailto:${quote.business_profile.email}" style="color:#2d3748;">${quote.business_profile.email}</a>
                    ${quote.business_profile.phone ? `<br>Phone: ${quote.business_profile.phone}` : ''}
                    <br><br>
                    <strong>${quote.business_profile.business_name || 'Professional Services'}</strong>
                    ${quote.business_profile.abn ? `<br>ABN: ${quote.business_profile.abn}` : ''}
                </div>
            </div>
        </div>

        <div class="footer">
            <div class="footer-text">
                This quote is valid for 30 days from the date of issue.<br>
                Professional quoting service
            </div>
        </div>
    </div>
</body>
</html>`;

    // Prepare email data
    const emailData = {
      from: senderEmail,
      to: [quote.clients.email],
      subject: `Quote for ${quote.job_title || 'Your Project'} - ${quote.business_profile.business_name || 'Professional Services'}`,
      html: emailHtml,
    };

    // Send email via Resend
    const emailResult = await resend.emails.send(emailData);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResult.data?.id,
        message: 'Quote sent successfully',
        debug: {
          clientEmail: quote.clients.email,
          businessName: quote.business_profile.business_name,
          quoteTotal: total,
          downpaymentAmount: downpaymentAmount,
          itemCount: formattedItems.length,
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
    let errorMessage = 'Failed to send email';
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