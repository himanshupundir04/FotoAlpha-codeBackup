/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
       colors: {
      blue: '#04BADE', 
      bgblue: '#ebf5ff',
      textblue: '#0265d1',
      blueHover: '#0d3f6b', 
      bgred: '#c20610', 
      bgredHover: '#94070f', 
    },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".w-webkit-fill-available": {
          width: "-webkit-fill-available",
        },
      });
    },
  ],
};
