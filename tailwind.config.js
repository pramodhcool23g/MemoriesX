/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "med-blue": "#233E4E",
        "med-teal": "#557D84",
        "med-aqua": "#A1BCBE",
        "med-aqua-vibrant": "#2DD4BF",
        "med-aqua-light": "#E5EEF0",
        "text-main": "#111827",
        "text-slate": "#4B5563",
        "vibrant-red": "#EF4444"
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      }
    },
  },
  plugins: [],
}
