import { createHash } from 'node:crypto';
import { parseCookie } from 'cookie';
import type { Request } from 'express';

export function extractAdminToken(
  request: Pick<Request, 'headers'>,
): string | null {
  const authorization = request.headers.authorization;
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7);
  return parseCookie(request.headers.cookie ?? '').s2s_admin_token ?? null;
}

export function hashAdminToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
