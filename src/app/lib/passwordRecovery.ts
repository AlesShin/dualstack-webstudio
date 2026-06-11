import { normalizeEmail } from './clientPortal';

const PASSWORD_RECOVERY_STORAGE_KEY = 'dualstack.password.recovery';
const PASSWORD_RECOVERY_TTL_MS = 15 * 60 * 1000;
const PASSWORD_RECOVERY_ENDPOINT = '/auth/send-password-reset.php';

interface PasswordRecoveryState {
  email: string;
  codeHash: string;
  expiresAt: string;
}

async function hashValue(value: string) {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return value;
  }

  const buffer = await window.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function parseRecoveryState(raw: string | null) {
  if (!raw) return null;

  try {
    const candidate = JSON.parse(raw) as Partial<PasswordRecoveryState>;

    if (
      typeof candidate.email !== 'string' ||
      typeof candidate.codeHash !== 'string' ||
      typeof candidate.expiresAt !== 'string'
    ) {
      return null;
    }

    return {
      email: normalizeEmail(candidate.email),
      codeHash: candidate.codeHash,
      expiresAt: candidate.expiresAt,
    } satisfies PasswordRecoveryState;
  } catch {
    return null;
  }
}

export function generatePasswordRecoveryCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function maskRecoveryEmail(email: string) {
  const normalized = normalizeEmail(email);
  const [localPart, domain = ''] = normalized.split('@');

  if (!localPart || !domain) {
    return normalized;
  }

  const visibleStart = localPart.slice(0, 2);
  const visibleEnd = localPart.slice(-1);
  const maskedLocal =
    localPart.length <= 3
      ? `${localPart[0] ?? ''}***`
      : `${visibleStart}${'*'.repeat(Math.max(localPart.length - 3, 2))}${visibleEnd}`;

  return `${maskedLocal}@${domain}`;
}

export async function storePasswordRecoveryCode(email: string, code: string) {
  if (typeof window === 'undefined') return;

  const recoveryState: PasswordRecoveryState = {
    email: normalizeEmail(email),
    codeHash: await hashValue(code.trim()),
    expiresAt: new Date(Date.now() + PASSWORD_RECOVERY_TTL_MS).toISOString(),
  };

  window.localStorage.setItem(
    PASSWORD_RECOVERY_STORAGE_KEY,
    JSON.stringify(recoveryState),
  );
}

export function loadPasswordRecoveryState() {
  if (typeof window === 'undefined') return null;

  return parseRecoveryState(
    window.localStorage.getItem(PASSWORD_RECOVERY_STORAGE_KEY),
  );
}

export function clearPasswordRecoveryState() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY);
}

export async function verifyPasswordRecoveryCode(email: string, code: string) {
  const recoveryState = loadPasswordRecoveryState();
  const normalizedEmail = normalizeEmail(email);

  if (!recoveryState || recoveryState.email !== normalizedEmail) {
    return 'missing' as const;
  }

  if (new Date(recoveryState.expiresAt).getTime() < Date.now()) {
    clearPasswordRecoveryState();
    return 'expired' as const;
  }

  const codeHash = await hashValue(code.trim());

  return codeHash === recoveryState.codeHash ? ('valid' as const) : ('invalid' as const);
}

export async function sendPasswordRecoveryCode(email: string, code: string) {
  const normalizedEmail = normalizeEmail(email);

  if (import.meta.env.DEV) {
    console.info(`[password-recovery] Recovery code for ${normalizedEmail}: ${code}`);
    return { mode: 'dev' as const };
  }

  const response = await fetch(PASSWORD_RECOVERY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email: normalizedEmail,
      code: code.trim(),
    }),
  });

  if (!response.ok) {
    throw new Error('recovery_send_failed');
  }

  return { mode: 'email' as const };
}
