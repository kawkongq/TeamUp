import { existsSync } from 'fs';
import { join } from 'path';

const PUBLIC_ROOT = join(process.cwd(), 'public');

function isExternalUrl(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith('data:');
}

export function normalizeAvatarUrl(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (isExternalUrl(trimmed)) {
    return trimmed;
  }

  const normalized = trimmed.startsWith('/') ? trimmed : `/uploads/${trimmed}`;
  const relativePath = normalized.replace(/^\/+/, '');
  const filePath = join(PUBLIC_ROOT, relativePath);

  if (!existsSync(filePath)) {
    return null;
  }

  return normalized;
}
