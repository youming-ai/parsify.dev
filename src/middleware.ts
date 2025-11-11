import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(zh-CN|zh-TW|ja|ko|es|fr|de|ar|he)/:path*']
};
