import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Initialize with a dummy key so the build doesn't fail if the env var is missing
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_to_pass_build');

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Authenticate requester as admin
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user || authData.user.email !== 'brynzulino@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, userId, status, adminNote, lang } = await req.json();

    if (!orderId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use Service Role to bypass RLS and fetch user email
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Supabase credentials missing on server. Check Vercel environment variables.' }, { status: 500 });
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey);

    // Fetch user email to send to
    const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    let emailAddress = user?.user?.email;

    if (error || !emailAddress) {
      // Fallback: Check if they are in public.users just in case we can't use admin api
      const { data: publicUser } = await supabaseAdmin.from('users').select('email').eq('id', userId).single();
      if (!publicUser?.email) {
        return NextResponse.json({ error: 'User email not found' }, { status: 404 });
      }
      emailAddress = publicUser.email;
    }
    const shortOrderId = orderId.split('-')[0].toUpperCase();

    const title = lang === 'es' ? 'Actualización de tu orden D-Fyo' : 'D-Fyo Order Update';

    // The exact verbiage requested by the user
    const message = lang === 'es'
      ? `¡Hola! Tenemos noticias sobre tu paquete. Tu orden <strong>#${shortOrderId}</strong> ha cambiado su estatus a: <strong>${status}</strong>.`
      : `Hello! We have updates on your package. Your order <strong>#${shortOrderId}</strong> status has changed to: <strong>${status}</strong>.`;

    // Sanitize HTML from adminNote
    const sanitizedNote = adminNote ? adminNote.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';

    const noteHtml = sanitizedNote
      ? `<div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border-left: 4px solid #00CED1; border-radius: 0 8px 8px 0; color: #334155; line-height: 1.5;">
          <strong>${lang === 'es' ? 'Nota del Administrador' : 'Admin Note'}:</strong><br/>
          ${sanitizedNote}
         </div>`
      : '';

    const buttonText = lang === 'es' ? 'Ver mi Orden' : 'View My Order';
    const buttonUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://d-fyo.com'}/orders`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; color: #1e293b; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 32px; letter-spacing: -1px;">
            D<span style="color: #00CED1; display: inline-block; transform: translateY(-4px);">—</span>Fyo
          </h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Concierge Shipping</p>
        </div>

        <p style="font-size: 16px; line-height: 1.6; color: #334155;">
          ${message}
        </p>

        ${noteHtml}

        <div style="text-align: center; margin-top: 48px; margin-bottom: 32px;">
          <a href="${buttonUrl}" style="background-color: #00CED1; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 206, 209, 0.2);">
            ${buttonText}
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 48px; margin-bottom: 24px;" />
        <p style="font-size: 13px; color: #94a3b8; text-align: center; line-height: 1.5;">
          ${lang === 'es' ? 'Gracias por confiar tus envíos a D-Fyo.' : 'Thank you for trusting D-Fyo with your shipments.'}<br/>
          <a href="https://d-fyo.com" style="color: #00CED1; text-decoration: none;">www.d-fyo.com</a>
        </p>
      </div>
    `;

    if (!emailAddress) {
      throw new Error("Resolved email address is empty.");
    }

    // Explicitly use the verified domain email as requested
    const senderEmail = process.env.RESEND_FROM_EMAIL || 'notifications@d-fyo.com';

    const { data, error: sendError } = await resend.emails.send({
      from: `D-Fyo Updates <${senderEmail}>`,
      to: emailAddress,
      subject: title,
      html: htmlContent,
    });

    if (sendError) {
      console.error('Resend API Error:', sendError);
      return NextResponse.json({ error: sendError.message }, { status: 500 });
    }

    console.log("Email dispatched to:", emailAddress);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('System Email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
