/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Node-RED 風格配色
        'red-brand': '#8f0000',
        'gray-panel': '#333333',
        'gray-canvas': '#e6e6e6',
      }
    },
  },
  plugins: [],
}