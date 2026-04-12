/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0D1117',
          secondary: '#161B22',
          tertiary: '#1C2128',
          card: '#21262D',
        },
        border: {
          default: '#30363D',
          muted: '#21262D',
        },
        accent: {
          cyan: '#00D9FF',
          purple: '#8B5CF6',
          green: '#2EA043',
          red: '#F85149',
          orange: '#D29922',
          blue: '#1F6FEB',
        },
        text: {
          primary: '#E6EDF3',
          secondary: '#8B949E',
          muted: '#484F58',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-card': 'linear-gradient(135deg, #1C2128 0%, #161B22 100%)',
        'gradient-purple': 'linear-gradient(135deg, #2D1B69 0%, #1C1033 100%)',
        'gradient-cyan': 'linear-gradient(135deg, #003D4F 0%, #001A22 100%)',
      }
    },
  },
  plugins: [],
}
