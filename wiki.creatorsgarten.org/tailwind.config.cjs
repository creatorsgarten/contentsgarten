const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      typography: {
        lg: {
          css: {
            lineHeight: '1.555555',
          },
        },
        DEFAULT: {
          css: {
            '--tw-prose-links': colors.sky[600],
            a: {
              textDecoration: 'none',
              fontWeight: 'inherit',
            },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
