"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";

export function SupportModal({ lang }: { lang: 'en' | 'es' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = {
    trigger: lang === 'es' ? 'Reportar Error / Soporte' : 'Report Error / Support',
    title: lang === 'es' ? 'Contactar Soporte' : 'Contact Support',
    name: lang === 'es' ? 'Nombre Completo' : 'Full Name',
    email: lang === 'es' ? 'Correo Electrónico' : 'Email Address',
    phone: lang === 'es' ? 'Número de Teléfono' : 'Phone Number',
    message: lang === 'es' ? 'Tu Mensaje / Reporte de Error' : 'Your Message / Error Report',
    attach: lang === 'es' ? 'Adjuntar Imagen (Opcional)' : 'Attach Image (Optional)',
    submit: lang === 'es' ? 'Enviar Mensaje' : 'Send Message',
    submitting: lang === 'es' ? 'Enviando...' : 'Submitting...',
    success: lang === 'es' ? 'Mensaje enviado correctamente. Te contactaremos pronto.' : 'Message sent successfully. We will contact you soon.',
    error: lang === 'es' ? 'Hubo un error al enviar tu mensaje.' : 'There was an error sending your message.',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const supabase = createClient();

    try {
      let attachmentUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `tickets/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('support_attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('support_attachments')
          .getPublicUrl(filePath);

        attachmentUrl = publicUrl;
      }

      const { data: userData } = await supabase.auth.getUser();

      const { error: insertError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: userData?.user?.id || null,
          name,
          email,
          phone,
          message,
          attachment_url: attachmentUrl,
        });

      if (insertError) throw insertError;

      toast.success(t.success);
      setIsOpen(false);
      setName(""); setEmail(""); setPhone(""); setMessage(""); setFile(null);
    } catch (err) {
      console.error(err);
      toast.error(t.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-gray-500 hover:text-primary transition-colors ml-4"
      >
        {t.trigger}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto relative text-left">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4">{t.title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t.name}</Label>
            <Input required value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t.email}</Label>
            <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t.phone}</Label>
            <Input required value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t.message}</Label>
            <Textarea required className="min-h-[100px]" value={message} onChange={e => setMessage(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t.attach}</Label>
            <Input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t.submitting : t.submit}
          </Button>
        </form>
      </div>
    </div>
  );
}
