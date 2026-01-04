/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#4A90A4', // Calm Blue
                secondary: '#7BC6B7', // Soft Teal
                accent: '#C7E1D9', // Pastel Green
                background: '#F5F9F7', // Off-white
                text: '#2E3A45', // Dark Grey
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
