import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Cache-Control: no-store em /login impede o browser de manter a
  // página no bfcache. Back-nav após OAuth força fresh load — pending,
  // split state e quaisquer outros caches do React nascem limpos.
  // Sem isso, o browser restaurava o snapshot e botões/layout ficavam
  // travados em estado intermediário.
  async headers() {
    return [
      {
        source: '/login',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
