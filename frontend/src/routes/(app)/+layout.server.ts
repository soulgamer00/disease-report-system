// src/routes/(app)/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url }) => {
  // ✅ SECURITY: Authentication check ทำผ่าน API calls
  // ไม่ต้อง verify JWT token ที่ SvelteKit server เพราะ:
  // 1. Frontend ไม่ควรมี JWT_SECRET
  // 2. ทุก protected API calls จะผ่าน backend auth middleware อยู่แล้ว
  // 3. ใช้ client-side auth store สำหรับ routing protection
  
  return {
    url: url.pathname
  };
};