/* CASPAA Tailwind Play CDN config — copied verbatim from the tailwind.config
   inline script in pages/_document.js. Load AFTER the Tailwind CDN script.
   Note the borderRadius override: every named radius is 7px. */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        site: { '50': '#eef6f7', '100': '#daedee', '200': '#b6dade', '300': '#84c2c8', '400': '#4aa4ae', '500': '#22909c', '600': '#0a8491', '700': '#086c77', '800': '#06545d', '900': '#053f46' },
        brand: { '50': '#eef6f7', '100': '#d3ebed', '200': '#b6dade', '300': '#84c2c8', '400': '#3fa0aa', '500': '#0a8491', '600': '#0a8491', '700': '#086c77', '800': '#06545d', '900': '#053f46' },
        navy: { '50': '#eef6f7', '100': '#d3ebed', '200': '#b6dade', '300': '#84c2c8', '400': '#3fa0aa', '500': '#22909c', '600': '#0a8491', '700': '#086c77', '800': '#06545d', '900': '#053f46' },
        accent: { '50': '#e6f8f3', '100': '#c3f0e2', '200': '#8ae4c9', '300': '#4fd6ae', '400': '#1ec79a', '500': '#00c08f', '600': '#00b386', '700': '#00966f', '800': '#007a5b', '900': '#005e46' },
        gold: { '50': '#fdf6e0', '100': '#fbe9bd', '200': '#f7d78a', '300': '#f0bc4e', '400': '#eba62b', '500': '#e69514', '600': '#c67d0c', '700': '#9c6208' },
        mod: { fees: '#00b386', academic: '#0a8491', students: '#e69514', staff: '#14a3a0', attendance: '#4bb543', reports: '#7a5cd6', comms: '#e0655c', store: '#d69e00' },
        scholar: { '400': '#9aa5b1', '500': '#808d9b', '600': '#6b7784' },
        emerald: { '50': '#e6f8f3', '100': '#c3f0e2', '200': '#8ae4c9', '300': '#4fd6ae', '400': '#1ec79a', '500': '#00c08f', '600': '#00b386', '700': '#00966f', '800': '#007a5b', '900': '#005e46' },
        apricot: { '50': '#fdf6e0', '100': '#fbe9bd', '200': '#f7d78a', '300': '#f0bc4e', '400': '#eba62b', '500': '#e69514', '600': '#c67d0c', '700': '#9c6208' },
        mint: { '100': '#e6f8f3', '200': '#c3f0e2', '300': '#8ae4c9', '400': '#4fd6ae' },
        sand: { '100': '#f8fafc', '200': '#e2e8f0', '300': '#cbd5e1', '400': '#94a3b8', '500': '#808d9b' },
        cream: { '50': '#f8fafc', '100': '#f1f5f9', '200': '#e2e8f0' }
      },
      borderRadius: { 'sm': '7px', 'DEFAULT': '7px', 'md': '7px', 'lg': '7px', 'xl': '7px', '2xl': '7px', '3xl': '7px', 'full': '9999px' },
      fontFamily: { sans: ['Figtree', 'system-ui', 'sans-serif'], mono: ['Figtree', 'system-ui', 'sans-serif'] }
    }
  }
};
