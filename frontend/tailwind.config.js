/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#ee6c2b",
        "background-light": "#fdfbf7",
        "background-dark": "#221610",
        "surface-light": "#ffffff",
        "surface-dark": "#2C221C",
        "text-primary-light": "#181311",
        "text-primary-dark": "#f4f2f0",
        "text-secondary-light": "#896f61",
        "text-secondary-dark": "#b0a095",
      },
      fontFamily: {
        "display": ["Be Vietnam Pro", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "2xl": "2rem",
        "full": "9999px"
      },
    },
  },
  plugins: [],
}

