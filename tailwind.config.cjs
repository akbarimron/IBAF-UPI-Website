/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
module.exports = {
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
