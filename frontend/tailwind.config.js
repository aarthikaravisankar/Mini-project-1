/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0b132b',
          800: '#1c2541',
          700: '#3a506b',
        },
        emergency: {
          red: '#dc2626',
          green: '#16a34a',
          orange: '#ea580c',
          blue: '#0284c7',
        }
      }
    },
  },
  plugins: [],
}
