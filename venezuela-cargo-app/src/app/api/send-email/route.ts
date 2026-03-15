import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';

// Initialize with a dummy key so the build doesn't fail if the env var is missing
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_to_pass_build');

export async function POST(req: Request) {
  try {
    const { orderId, userId, status, adminNote, lang } = await req.json();

    if (!orderId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch user email to send to
    const supabase = await createClient();
    const { data: user, error } = await supabase.auth.admin.getUserById(userId);

    let emailAddress = user?.user?.email;

    if (error || !emailAddress) {
      // Fallback: Check if they are in public.users just in case we can't use admin api
      const { data: publicUser } = await supabase.from('users').select('email').eq('id', userId).single();
      if (!publicUser?.email) {
        return NextResponse.json({ error: 'User email not found' }, { status: 404 });
      }
      emailAddress = publicUser.email;
    }
    const shortOrderId = orderId.split('-')[0].toUpperCase();

    const title = lang === 'es' ? 'Actualización de tu envío D-Fyo' : 'D-Fyo Shipping Update';
    const hello = lang === 'es' ? 'Hola,' : 'Hello,';
    const message = lang === 'es'
      ? `El estado de tu orden <strong>#${shortOrderId}</strong> ha sido actualizado a: <strong>${status}</strong>.`
      : `Your order <strong>#${shortOrderId}</strong> status has been updated to: <strong>${status}</strong>.`;

    const noteHtml = adminNote
      ? `<div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-left: 4px solid #f97316; color: #374151;">
          <strong>${lang === 'es' ? 'Nota del Administrador' : 'Admin Note'}:</strong><br/>
          ${adminNote}
         </div>`
      : '';

    const buttonText = lang === 'es' ? 'Ver mi Orden' : 'View My Order';
    const buttonUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://d-fyo.com'}/orders`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #111827; margin: 0;">D<span style="color: #f97316;">-</span>Fyo</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Concierge Shipping Service</p>
        </div>

        <p>${hello}</p>
        <p>${message}</p>

        ${noteHtml}

        <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
          <a href="${buttonUrl}" style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            ${buttonText}
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 40px; margin-bottom: 20px;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          ${lang === 'es' ? 'Gracias por elegir D-Fyo.' : 'Thank you for choosing D-Fyo.'}
        </p>
      </div>
    `;

    if (!emailAddress) {
      throw new Error("Resolved email address is empty.");
    }

    // Use a generic sender address if a custom domain isn't fully configured, though Resend prefers verified domains.
    // If this fails due to domain verification, Resend provides 'onboarding@resend.dev' for testing to verified emails.
    const senderEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    await resend.emails.send({
      from: `D-Fyo Updates <${senderEmail}>`,
      to: emailAddress,
      subject: title,
      html: htmlContent,
    });

    console.log("Email dispatched to:", emailAddress);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
