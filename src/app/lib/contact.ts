export const CONTACT_EMAIL = 'info@dualstack.ru';
export const CONTACT_PHONE = '+7 (916) 212-25-32';
export const CONTACT_FORM_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;
export const CONTACT_TELEGRAM = '@DualStack';
export const CONTACT_TELEGRAM_LINK = 'https://t.me/DualStack';

interface ContactSubmissionPayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
  subject: string;
  source?: string;
  details?: Record<string, string | undefined>;
}

export async function submitContactSubmission({
  name,
  email,
  phone,
  message,
  subject,
  source,
  details,
}: ContactSubmissionPayload) {
  const payload: Record<string, string> = {
    name,
    email,
    phone: phone?.trim() || 'не указан',
    message,
    _subject: subject,
    _captcha: 'false',
    _template: 'table',
  };

  if (source) {
    payload.source = source;
  }

  if (details) {
    Object.entries(details).forEach(([key, value]) => {
      const normalizedValue = value?.trim();

      if (normalizedValue) {
        payload[key] = normalizedValue;
      }
    });
  }

  const response = await fetch(CONTACT_FORM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('send_failed');
  }
}
