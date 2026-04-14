/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['14px', '22px'],
        lg: ['16px', '24px'],
        xl: ['18px', '28px'],
        '2xl': ['22px', '30px'],
        '3xl': ['28px', '36px'],
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.06)',
        DEFAULT: '0 1px 3px rgba(0, 0, 0, 0.06)',
        md: '0 2px 6px rgba(0, 0, 0, 0.06)',
        lg: '0 4px 12px rgba(0, 0, 0, 0.06)',
        xl: '0 8px 24px rgba(0, 0, 0, 0.08)',
      },
      colors: {
        zellu: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
    },
  },
  plugins: [],
};
