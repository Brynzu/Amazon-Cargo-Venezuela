import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_to_pass_build');

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, clientName, price, items } = await req.json();

    const senderEmail = process.env.RESEND_FROM_EMAIL || 'notifications@d-fyo.com';
    const adminEmail = 'brynzulino@gmail.com';
    const shortOrderId = orderId.split('-')[0].toUpperCase();

    let itemsHtml = '';
    if (items && Array.isArray(items)) {
      itemsHtml = items.map((item: any) => `<li><a href="${item.url}">${item.name || 'Product'}</a> - $${item.price}</li>`).join('');
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #00CED1;">New Order Submitted!</h2>
        <p>A new order (<strong>#${shortOrderId}</strong>) is waiting for your approval.</p>
        <ul style="line-height: 1.6;">
          <li><strong>Customer:</strong> ${clientName}</li>
          <li><strong>Estimated Total:</strong> $${price}</li>
        </ul>
        <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #00CED1;">
          <strong>Items:</strong>
          <ul>
            ${itemsHtml}
          </ul>
        </div>
        <p style="margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://d-fyo.com'}/admin" style="background-color: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Admin Panel</a>
        </p>
      </div>
    `;

    const { error: sendError } = await resend.emails.send({
      from: `D-Fyo Admin <${senderEmail}>`,
      to: adminEmail,
      subject: `New Order Pending Approval - #${shortOrderId}`,
      html: htmlContent,
    });

    if (sendError) {
      console.error('Resend API Error (Admin Notification):', sendError);
      return NextResponse.json({ error: sendError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin Notification Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
