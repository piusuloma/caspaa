import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="theme-color" content="#00b386" />
        {/* PWA — installable, offline-capable */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CASPAA" />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%2300b386'/%3E%3Ctext x='50' y='68' font-size='56' font-weight='700' text-anchor='middle' fill='white' font-family='system-ui'%3EC%3C/text%3E%3C/svg%3E"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/css/styles.css" />
        {/* Tailwind Play CDN + Chart.js must load before app scripts */}
        <script src="https://cdn.tailwindcss.com" />
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.css" />
        <script src="https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.js" />
        <script src="https://cdn.jsdelivr.net/npm/apexcharts@3.49.1/dist/apexcharts.min.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `tailwind.config={theme:{extend:{colors:{brand:{'50':'#e6f8f3','100':'#c3f0e2','200':'#8ae4c9','300':'#4fd6ae','400':'#1ec79a','500':'#00c08f','600':'#00b386','700':'#00966f','800':'#007a5b','900':'#005e46'},navy:{'50':'#eef2f7','100':'#d6dfe9','200':'#adc0d3','300':'#7593b3','400':'#3f6489','500':'#1d4266','600':'#123354','700':'#0d2c49','800':'#0a2540','900':'#071b30'},gold:{'50':'#fef8e7','100':'#fdecb8','200':'#fbdd85','300':'#f9cd52','400':'#f7c02c','500':'#f4b400','600':'#d69e00','700':'#ab7f00'},scholar:{'400':'#9aa5b1','500':'#808d9b','600':'#6b7784'},emerald:{'50':'#e6f8f3','100':'#c3f0e2','200':'#8ae4c9','300':'#4fd6ae','400':'#1ec79a','500':'#00c08f','600':'#00b386','700':'#00966f','800':'#007a5b','900':'#005e46'},coral:{'50':'#e6f8f3','100':'#c3f0e2','200':'#8ae4c9','300':'#4fd6ae','400':'#1ec79a','500':'#00b386','600':'#00966f','700':'#007a5b'},apricot:{'50':'#fef8e7','100':'#fdecb8','200':'#fbdd85','300':'#f9cd52','400':'#f7c02c','500':'#f4b400','600':'#d69e00','700':'#ab7f00'},mint:{'100':'#e6f8f3','200':'#c3f0e2','300':'#8ae4c9','400':'#4fd6ae'},sand:{'100':'#f8fafc','200':'#e2e8f0','300':'#cbd5e1','400':'#94a3b8','500':'#808d9b'},cream:{'50':'#f8fafc','100':'#f1f5f9','200':'#e2e8f0'}},borderRadius:{'sm':'7px','DEFAULT':'7px','md':'7px','lg':'7px','xl':'7px','2xl':'7px','3xl':'7px','full':'9999px'},fontFamily:{sans:['Figtree','system-ui','sans-serif'],mono:['Figtree','system-ui','sans-serif']}}}}`
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
