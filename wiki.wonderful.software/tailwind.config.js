const { fontFamily } = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        prose: ['var(--font-latin)', 'var(--font-thai)', ...fontFamily.sans],
      },
      typography: (theme) => ({
        lg: {
          css: {
            lineHeight: '1.555555',
          },
        },
        DEFAULT: {
          css: {
            '--tw-prose-links': '#da3567',
            a: {
              textDecoration: 'none',
              fontWeight: 'inherit',
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
