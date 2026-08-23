import nodemailer from 'nodemailer';
import { config } from '../config.js';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.emailUser,
        pass: config.emailPass,
      },
    });
  }
  return transporter;
}

export function emailEnabled() {
  return Boolean(config.emailUser && config.emailPass && config.emailFrom);
}

export async function verifyEmailConnection() {
  if (!emailEnabled()) return false;
  await getTransporter().verify();
  return true;
}

export async function sendEmail({ to, subject, html, text }) {
  if (!emailEnabled()) {
    const err = new Error('Email service is not configured');
    err.code = 'EMAIL_NOT_CONFIGURED';
    err.statusCode = 503;
    throw err;
  }

  try {
    return await getTransporter().sendMail({
      from: config.emailFrom,
      to,
      subject,
      html,
      text,
    });
  } catch (cause) {
    const err = new Error(cause?.message || 'Email provider rejected the request');
    err.code = 'EMAIL_PROVIDER_ERROR';
    err.statusCode = 502;
    err.cause = cause;
    throw err;
  }
}

export async function sendWelcomeEmail(user) {
  const name = escapeHtml(user.name || user.username || '');
  return sendEmail({
    to: user.email,
    subject: 'Bienvenido a la familia Zhealth 💜',
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h1 style="color:#6d3df5">Bienvenido a Zhealth, ${name}</h1><p>Gracias por unirte a la familia de Zhealth.</p><p>Desde hoy podés llevar nutrición, hidratación, actividad, sueño, peso y entrenamiento en un solo lugar.</p><p>Tu progreso no tiene que ser perfecto: queremos ayudarte a hacerlo consistente.</p><p><a href="${config.appUrl}" style="display:inline-block;background:#6d3df5;color:white;padding:12px 18px;border-radius:10px;text-decoration:none">Abrir Zhealth</a></p></div>`,
    text: `Bienvenido a Zhealth, ${user.name}. Gracias por unirte a la familia de Zhealth. Abrí tu cuenta en ${config.appUrl}`
  });
}

export async function sendResetCodeEmail(user, code) {
  return sendEmail({
    to: user.email,
    subject: 'Tu código para restablecer Zhealth',
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2 style="color:#6d3df5">Restablecer contraseña</h2><p>Usá este código de 6 dígitos:</p><div style="font-size:32px;font-weight:800;letter-spacing:8px;margin:24px 0">${code}</div><p>El código expira en 15 minutos. Si no solicitaste este cambio, ignorá este correo.</p></div>`,
    text: `Tu código de Zhealth es ${code}. Expira en 15 minutos.`
  });
}

export async function sendInactivityEmail(user, days) {
  const name = escapeHtml(user.name || user.username || '');
  return sendEmail({
    to: user.email,
    subject: 'Zhealth te extraña 👀',
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2 style="color:#6d3df5">Hey ${name}, ¿todo bien?</h2><p>Han pasado alrededor de ${days} días desde tu última actividad en Zhealth.</p><p>Quizá se te pasó registrar tus macros, peso, agua, sueño o entrenamiento. Un registro rápido basta para retomar tu historial.</p><p><a href="${config.appUrl}" style="display:inline-block;background:#6d3df5;color:white;padding:12px 18px;border-radius:10px;text-decoration:none">Volver a Zhealth</a></p><p style="color:#666;font-size:13px">Podés desactivar estos correos desde Configuración → Notificaciones.</p></div>`,
    text: `Han pasado ${days} días desde tu última actividad en Zhealth. Volvé cuando quieras: ${config.appUrl}`
  });
}

export async function sendReminderDigestEmail(user, reminders) {
  const items = reminders.map(r => `<li style="margin:8px 0">${escapeHtml(r.message)}</li>`).join('');
  return sendEmail({
    to: user.email,
    subject: 'Tus recordatorios de Zhealth',
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2 style="color:#6d3df5">Un pequeño recordatorio 💜</h2><ul>${items}</ul><p><a href="${config.appUrl}" style="display:inline-block;background:#6d3df5;color:white;padding:12px 18px;border-radius:10px;text-decoration:none">Abrir Zhealth</a></p><p style="color:#666;font-size:13px">Controlá qué correos recibís desde Notificaciones.</p></div>`,
    text: `Recordatorios de Zhealth:\n${reminders.map(r=>'- '+r.message).join('\n')}\n${config.appUrl}`
  });
}
