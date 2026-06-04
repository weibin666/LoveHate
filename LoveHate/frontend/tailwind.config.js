/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        love: '#ff4d6d',
        hate: '#845ec2',
        warm: '#ffc09f',
        ice: '#a2d2ff',
        gold: '#ffd700',
        bg: '#0f0f1a',
        surface: '#1a1a2e',
        'surface-light': '#25253e',
      },
    },
  },
  plugins: [],
}
