import { config } from '../config.js';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}

function sanitizeHeader(value = '') {
  return String(value).replace(/[\r\n]+/g, ' ').trim();
}

function encodeHeader(value = '') {
  const clean = sanitizeHeader(value);
  return `=?UTF-8?B?${Buffer.from(clean, 'utf8').toString('base64')}?=`;
}

function toBase64Url(value) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function buildMimeMessage({ to, subject, html, text }) {
  const boundary = `zhealth_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const from = sanitizeHeader(config.emailFrom);
  const recipient = sanitizeHeader(to);
  const plain = String(text || '').replace(/\r?\n/g, '\r\n');
  const markup = String(html || '');

  const lines = [
    `From: ${from}`,
    `To: ${recipient}`,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    plain,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    markup,
    '',
    `--${boundary}--`,
    ''
  ];

  return lines.join('\r\n');
}

let accessTokenCache = null;

export function emailEnabled() {
  return Boolean(
    config.emailUser &&
    config.emailFrom &&
    config.gmailClientId &&
    config.gmailClientSecret &&
    config.gmailRefreshToken
  );
}

async function getAccessToken() {
  if (!emailEnabled()) {
    const err = new Error('Email service is not configured');
    err.code = 'EMAIL_NOT_CONFIGURED';
    err.statusCode = 503;
    throw err;
  }

  if (accessTokenCache?.token && Date.now() < accessTokenCache.expiresAt) {
    return accessTokenCache.token;
  }

  const body = new URLSearchParams({
    client_id: config.gmailClientId,
    client_secret: config.gmailClientSecret,
    refresh_token: config.gmailRefreshToken,
    grant_type: 'refresh_token'
  });

  let response;
  try {
    response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(15_000)
    });
  } catch (cause) {
    const err = new Error(cause?.message || 'Could not reach Google OAuth');
    err.code = 'EMAIL_OAUTH_NETWORK_ERROR';
    err.statusCode = 502;
    err.cause = cause;
    throw err;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    const err = new Error(data.error_description || data.error || 'Google OAuth rejected the refresh token');
    err.code = 'EMAIL_OAUTH_ERROR';
    err.statusCode = 502;
    err.providerStatus = response.status;
    throw err;
  }

  const expiresInSeconds = Number(data.expires_in || 3600);
  accessTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(60, expiresInSeconds - 90) * 1000
  };
  return accessTokenCache.token;
}

export async function verifyEmailConnection() {
  await getAccessToken();
  return true;
}

export async function sendEmail({ to, subject, html, text }) {
  const token = await getAccessToken();
  const raw = toBase64Url(buildMimeMessage({ to, subject, html, text }));

  let response;
  try {
    response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw }),
      signal: AbortSignal.timeout(20_000)
    });
  } catch (cause) {
    const err = new Error(cause?.message || 'Could not reach Gmail API');
    err.code = 'EMAIL_PROVIDER_NETWORK_ERROR';
    err.statusCode = 502;
    err.cause = cause;
    throw err;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // If Google rejected a cached access token, discard it so the next request refreshes it.
    if (response.status === 401) accessTokenCache = null;
    const providerMessage = data?.error?.message || `Gmail API returned ${response.status}`;
    const err = new Error(providerMessage);
    err.code = 'EMAIL_PROVIDER_ERROR';
    err.statusCode = 502;
    err.providerStatus = response.status;
    throw err;
  }

  return data;
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
