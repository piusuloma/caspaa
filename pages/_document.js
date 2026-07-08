import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="theme-color" content="#234e70" />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%23234e70'/%3E%3Ctext x='50' y='68' font-size='56' font-weight='700' text-anchor='middle' fill='white' font-family='system-ui'%3EC%3C/text%3E%3C/svg%3E"
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
        <script
          dangerouslySetInnerHTML={{
            __html: `tailwind.config={theme:{extend:{colors:{brand:{'50':'#eff4f8','100':'#d9e3ee','200':'#b0c6da','300':'#7ba0c2','400':'#4a7fac','500':'#2f628d','600':'#234e70','700':'#1c3f5b','800':'#163248','900':'#102230'},coral:{'50':'#fff1f0','100':'#ffdedb','200':'#ffc2bc','300':'#fe9c93','400':'#fd7d71','500':'#fd5f54','600':'#e8483d','700':'#c2352b'},apricot:{'50':'#fdf6ee','100':'#fbe9d3','200':'#f6d3a9','300':'#f2c493','400':'#f0bd88','500':'#efb67f','600':'#e2a05f','700':'#c98240'},sand:{'100':'#f2f0e4','200':'#e6e2cd','300':'#d6d1b1','400':'#c4bd93','500':'#afa771'},cream:{'50':'#f8fbef','100':'#eff5db','200':'#e4eec3'},mint:{'100':'#e3f6e9','200':'#c7eecf','300':'#a6e0b3','400':'#7fce90'},gold:{'400':'#f0bd88','500':'#efb67f','600':'#e2a05f'}},borderRadius:{'sm':'7px','DEFAULT':'7px','md':'7px','lg':'7px','xl':'7px','2xl':'7px','3xl':'7px','full':'9999px'},fontFamily:{sans:['Figtree','system-ui','sans-serif']}}}}`
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
