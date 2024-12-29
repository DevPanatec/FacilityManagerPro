import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const emailTemplates = {
  VERIFY_EMAIL: {
    subject: 'Verifica tu correo electrónico',
    template: `
      <h1>Bienvenido a nuestra plataforma</h1>
      <p>Por favor verifica tu correo haciendo clic en el siguiente enlace:</p>
      <a href="{{verificationLink}}">Verificar Email</a>
    `
  },
  RESET_PASSWORD: {
    subject: 'Recuperación de contraseña',
    template: `
      <h1>Recuperación de contraseña</h1>
      <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
      <a href="{{resetLink}}">Restablecer Contraseña</a>
    `
  },
  TWO_FACTOR_CODE: {
    subject: 'Código de verificación',
    template: `
      <h1>Tu código de verificación</h1>
      <p>Usa el siguiente código para completar tu inicio de sesión:</p>
      <h2>{{code}}</h2>
    `
  }
};

export async function sendEmail(
  to: string,
  templateName: keyof typeof emailTemplates,
  variables: Record<string, string>
) {
  const template = emailTemplates[templateName];
  let html = template.template;
  
  // Reemplazar variables
  Object.entries(variables).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  // Aquí iría la lógica de envío de email
  // Por ahora, solo registramos el intento
  await supabase.from('email_logs').insert({
    to,
    template_name: templateName,
    variables,
    status: 'PENDING'
  });
} 