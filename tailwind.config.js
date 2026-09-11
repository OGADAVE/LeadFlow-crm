/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Base surfaces — deep navy, not pure black
        navy: '#0A0F1E',
        panel: '#111A2E',
        card: '#141F38',
        raised: '#1A2740',
        border: '#22304D',
        // Text
        ink: '#F1F5F9',
        subtle: '#94A3B8',
        // Brand gradient — blue to cyan, matches the logo
        brand: '#3B82F6',
        'brand-light': '#22D3EE',
        'brand-dark': '#2563EB',
        // Status colors
        success: '#22C55E',
        danger: '#F43F5E',
        warning: '#F59E0B',
        hot: '#F97316',
        purple: '#A855F7',
        teal: '#14B8A6'
      },
      fontFamily: {
        display: ['"DM Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #3B82F6 0%, #22D3EE 100%)'
      }
    }
  },
  plugins: []
};
