export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@bitrix24/b24ui-nuxt', '@bitrix24/b24jssdk-nuxt', '@pinia/nuxt', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  ssr: false,
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  app: {
    head: {
      meta: [
        { 'http-equiv': 'Cache-Control', content: 'no-cache, no-store, must-revalidate' },
        { 'http-equiv': 'Pragma', content: 'no-cache' },
        { 'http-equiv': 'Expires', content: '0' }
      ]
    }
  },
  eslint: {
    checker: false
  }
})
