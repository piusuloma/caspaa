import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="theme-color" content="#0a8491" />
        {/* PWA — installable, offline-capable */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CASPAA" />
        {/* The real CASPAA mark, reversed white out of a #0a8491 tile. */}
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/css/styles.css" />
        {/* Brand theme layer — must load AFTER styles.css. Re-points the navy
            action colour and #f4b400 gold onto the brand-guide palette. */}
        <link rel="stylesheet" href="/css/theme.css" />
        {/* Arms the scroll-reveal CSS before first paint, so revealed elements
            never flash in visible and then re-hide. If JS is off this never
            runs, the CSS stays inert, and the page renders fully. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.classList.add('reveal-ready')}catch(e){}`
          }}
        />
        {/* Tailwind Play CDN + Chart.js must load before app scripts */}
        <script src="https://cdn.tailwindcss.com" />
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.css" />
        <script src="https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.js" />
        <script src="https://cdn.jsdelivr.net/npm/apexcharts@3.49.1/dist/apexcharts.min.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `tailwind.config={theme:{extend:{colors:{site:{'50':'#eef6f7','100':'#daedee','200':'#b6dade','300':'#84c2c8','400':'#4aa4ae','500':'#22909c','600':'#0a8491','700':'#086c77','800':'#06545d','900':'#053f46'},brand:{'50':'#eef6f7','100':'#d3ebed','200':'#b6dade','300':'#84c2c8','400':'#3fa0aa','500':'#0a8491','600':'#0a8491','700':'#086c77','800':'#06545d','900':'#053f46'},navy:{'50':'#eef6f7','100':'#d3ebed','200':'#b6dade','300':'#84c2c8','400':'#3fa0aa','500':'#22909c','600':'#0a8491','700':'#06545d','800':'#06545d','900':'#053f46'},accent:{'50':'#e6f8f3','100':'#c3f0e2','200':'#8ae4c9','300':'#4fd6ae','400':'#1ec79a','500':'#00c08f','600':'#00b386','700':'#00966f','800':'#007a5b','900':'#005e46'},gold:{'50':'#fdf6e0','100':'#fbe9bd','200':'#f7d78a','300':'#f0bc4e','400':'#eba62b','500':'#e69514','600':'#c67d0c','700':'#9c6208'},scholar:{'400':'#9aa5b1','500':'#808d9b','600':'#6b7784'},emerald:{'50':'#e6f8f3','100':'#c3f0e2','200':'#8ae4c9','300':'#4fd6ae','400':'#1ec79a','500':'#00c08f','600':'#00b386','700':'#00966f','800':'#007a5b','900':'#005e46'},coral:{'50':'#e6f8f3','100':'#c3f0e2','200':'#8ae4c9','300':'#4fd6ae','400':'#1ec79a','500':'#00b386','600':'#00966f','700':'#007a5b'},apricot:{'50':'#fdf6e0','100':'#fbe9bd','200':'#f7d78a','300':'#f0bc4e','400':'#eba62b','500':'#e69514','600':'#c67d0c','700':'#9c6208'},mint:{'100':'#e6f8f3','200':'#c3f0e2','300':'#8ae4c9','400':'#4fd6ae'},sand:{'100':'#f8fafc','200':'#e2e8f0','300':'#cbd5e1','400':'#94a3b8','500':'#808d9b'},cream:{'50':'#f8fafc','100':'#f1f5f9','200':'#e2e8f0'}},borderRadius:{'sm':'7px','DEFAULT':'7px','md':'7px','lg':'7px','xl':'7px','2xl':'7px','3xl':'7px','full':'9999px'},fontFamily:{sans:['Figtree','system-ui','sans-serif'],mono:['Figtree','system-ui','sans-serif']}}}}`
          }}
        />
      </Head>
      <body className="bg-slate-50 text-slate-800 antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
