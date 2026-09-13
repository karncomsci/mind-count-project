import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-13',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt', '@nuxt/eslint'],
  css: ['~/assets/main.css'],
  typescript: { strict: true, typeCheck: true },
  vite: { plugins: [tailwindcss()] },
  runtimeConfig: {
    apiBaseUrl: 'http://localhost:8080',
    apiTimeoutMs: 5000,
  },
  app: { head: { title: 'Mind Count', htmlAttrs: { lang: 'th' } } },
})
