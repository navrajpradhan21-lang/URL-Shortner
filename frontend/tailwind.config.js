/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#171a2b",
        muted: "#85899d",
        violet: "#6857e8",
      },
      boxShadow: {
        card: "0 16px 50px rgba(34, 36, 67, 0.06)",
      },
    },
  },
  plugins: [],
};
