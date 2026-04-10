import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./frontend/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#090B10",
        midnight: "#101521",
        panel: "#131A29",
        border: "#23304A",
        accent: "#5EEAD4",
        ember: "#FB7185",
        signal: "#93C5FD",
      },
      fontFamily: {
        sans: ["Segoe UI Variable", "Segoe UI", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(94, 234, 212, 0.14), 0 20px 80px rgba(20, 184, 166, 0.16)",
      },
      backgroundImage: {
        halo:
          "radial-gradient(circle at top, rgba(94,234,212,0.22), transparent 38%), radial-gradient(circle at 80% 15%, rgba(147,197,253,0.16), transparent 28%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
