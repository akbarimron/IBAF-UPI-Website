/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ibaf-red': '#B63333',
        'ibaf-red-dark': '#8a2525',
      },
    },
  },
  plugins: [],
}
