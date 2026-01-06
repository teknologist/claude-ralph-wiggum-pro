import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        claude: {
          coral: '#E07A5F',
          'coral-dark': '#DA7756',
          cream: '#FAF9F6',
          dark: '#1A1A1A',
        },
      },
      screens: {
        xs: '375px', // iPhone SE and up
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
      spacing: {
        safe: 'env(safe-area-inset)',
      },
    },
  },
  plugins: [
    // Enable safe-area variants for devices with notches
    function ({ addUtilities }: { addUtilities: any }) {
      addUtilities({
        '.pt-safe': { 'padding-top': 'env(safe-area-inset-top)' },
        '.pb-safe': { 'padding-bottom': 'env(safe-area-inset-bottom)' },
        '.pl-safe': { 'padding-left': 'env(safe-area-inset-left)' },
        '.pr-safe': { 'padding-right': 'env(safe-area-inset-right)' },
      });
    },
  ],
} satisfies Config;
