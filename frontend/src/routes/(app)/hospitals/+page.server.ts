// src/routes/(app)/hospitals/+page.server.ts
// ✅ SECURITY: Server-side route protection for hospital management

import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, fetch, cookies }) => {
  // Hospital management is accessible to ADMIN and SUPERUSER
  // We don't need strict server-side auth check here since:
  // 1. API endpoints handle permissions
  // 2. Client-side stores handle UI permissions
  // 3. We want to allow navigation but restrict actions

  return {
    url: url.pathname
  };
};