import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#D4AF37',
          50: '#FBF6E3',
          100: '#F7EDC7',
          200: '#EEDB8F',
          300: '#E4C856',
          400: '#D4AF37',
          500: '#B8972E',
          600: '#8C7223',
          700: '#5F4D17',
          800: '#33290C',
          900: '#1A1406',
        },
        ink: {
          DEFAULT: '#0A0A0A',
          900: '#0A0A0A',
          800: '#141414',
          700: '#1F1F1F',
          600: '#2A2A2A',
          500: '#3D3D3D',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
