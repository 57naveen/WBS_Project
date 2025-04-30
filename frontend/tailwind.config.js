/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {screens: {
      xs: '430px',
    },
  },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
