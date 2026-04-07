/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0f1117',
          secondary: '#1a1d27',
          tertiary: '#22263a',
          card: '#1e2235',
        },
        accent: {
          blue: '#4f6ef7',
          purple: '#8b5cf6',
          green: '#10b981',
          red: '#ef4444',
          orange: '#f59e0b',
          pink: '#ec4899',
        },
        border: '#2d3148',
        text: {
          primary: '#e2e8f0',
          secondary: '#94a3b8',
          muted: '#64748b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: []
};
