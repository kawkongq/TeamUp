import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_COOKIE_NAME = 'teamup_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const ALGORITHM = 'sha256';

type SessionPayload = {
  sub: string;
  role: string;
  exp: number;
};

function getSessionSecret(): string {
  const secret =
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error(
      'Missing session secret. Define NEXTAUTH_SECRET (or AUTH_SECRET / SESSION_SECRET) in the environment.',
    );
  }

  return secret;
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4);
  return Buffer.from(normalized + '='.repeat(padding), 'base64');
}

export function createSessionToken(userId: string, role: string): string {
  const payload: SessionPayload = {
    sub: userId,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadBytes = Buffer.from(payloadJson, 'utf8');
  const payloadB64 = base64UrlEncode(payloadBytes);

  const secret = getSessionSecret();
  const signature = createHmac(ALGORITHM, secret).update(payloadB64).digest();
  const signatureB64 = base64UrlEncode(signature);

  return `${payloadB64}.${signatureB64}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [payloadB64, signatureB64] = token.split('.');
  if (!payloadB64 || !signatureB64) {
    return null;
  }

  const secret = getSessionSecret();
  const expectedSignature = createHmac(ALGORITHM, secret).update(payloadB64).digest();
  const providedSignature = base64UrlDecode(signatureB64);

  if (
    expectedSignature.length !== providedSignature.length ||
    !timingSafeEqual(expectedSignature, providedSignature)
  ) {
    return null;
  }

  try {
    const payloadJson = base64UrlDecode(payloadB64).toString('utf8');
    const payload = JSON.parse(payloadJson) as SessionPayload;

    if (
      !payload ||
      typeof payload.sub !== 'string' ||
      typeof payload.role !== 'string' ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };
