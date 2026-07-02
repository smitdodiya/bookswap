/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F5F0E8",
        card: "#FBF8F3",
        primary: "#C4622D",
        "primary-dark": "#A9531F",
        ink: "#2B2622",
        muted: "#8A8078",
        line: "#E8E0D4",
        // book cover palette
        sage: "#DCE3D4",
        lavender: "#DDD8EC",
        beige: "#E9E2D4",
        terracotta: "#EDD9CC",
        slate: "#D9DFDC",
        // badge accents
        "badge-green": "#7C8A5E",
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 3px rgba(43,38,34,0.06), 0 1px 2px rgba(43,38,34,0.04)",
        card: "0 2px 12px rgba(43,38,34,0.06)",
        lift: "0 14px 30px -12px rgba(43,38,34,0.18)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fadeIn 0.4s ease both",
        "pop-in": "popIn 0.22s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};
