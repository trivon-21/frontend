/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#00682f",
        "primary-container": "#00843d",
        "primary-fixed": "#8ef9a4",
        "primary-lighter": "#e7ffe6",
        "secondary": "#406747",
        "tertiary": "#9d344c",
        "surface": "#f5fbf1",
        "surface-container": "#eaf0e6",
        "surface-container-low": "#eff5ec",
        "surface-container-lowest": "#ffffff",
        "on-surface": "#171d17",
        "on-surface-variant": "#3e4a3e",
        "outline": "#6e7a6e",
        "outline-variant": "#bdcabb",
        "inverse-surface": "#2c322c",
        "primary-active": "#1A2421",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'DEFAULT': '0.25rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        'full': '9999px'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
