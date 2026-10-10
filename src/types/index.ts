import type { Link, Click } from '@prisma/client';

export type { Link, Click };

export interface CreateLinkInput {
  url: string;
  customSlug?: string;
  expiresAt?: string | null;
}

export interface LinkWithCount extends Link {
  _count: { clicks: number };
}

export interface LinkDetail extends Link {
  clicks: Click[];
  _count: { clicks: number };
}

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface DailyClicksPoint {
  date: string;
  clicks: number;
}
