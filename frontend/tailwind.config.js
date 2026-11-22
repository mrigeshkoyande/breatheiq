/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F8FAF7",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#005C55",
          container: "#0F766E",
          deep: "#115E59",
          tint: "#DDF5EC",
        },
        secondary: {
          DEFAULT: "#216963",
          soft: "#A7E8C6",
          container: "#A8ECE5",
        },
        ink: {
          DEFAULT: "#182A29",
          muted: "#64748B",
        },
        outline: {
          DEFAULT: "#E2E8F0",
          focused: "#CCFBF1",
        },
        cpcb: {
          good: "#2F9E62",
          satisfactory: "#7CB342",
          moderate: "#F2B705",
          poor: "#F28C28",
          veryPoor: "#DC5252",
          severe: "#8B1E3F",
        },
      },
      fontFamily: {
        heading: ["'Plus Jakarta Sans'", "sans-serif"],
        sans: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        atmospheric: "0 4px 20px -2px rgba(24, 42, 41, 0.04), 0 2px 6px -1px rgba(24, 42, 41, 0.02)",
        elevated: "0 12px 32px -4px rgba(24, 42, 41, 0.08), 0 4px 12px -2px rgba(24, 42, 41, 0.03)",
      },
    },
  },
  plugins: [],
}
