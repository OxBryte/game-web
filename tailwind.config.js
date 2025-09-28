/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#667eea",
          dark: "#764ba2",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "bounce-custom": "bounce 2s infinite",
        "pulse-custom": "pulse 2s infinite",
      },
      keyframes: {
        fadeIn: {
          from: {
            opacity: "0",
            transform: "translateY(20px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
    },
  },
  plugins: [],
};
