import type { Metadata, Viewport } from 'next'
import ThemeInit from '@/components/ThemeInit'
import './globals.css'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://www.slushfinder.com'),
  title: 'Slush Finder — Find Slushy Machines Worldwide',
  description: 'Discover Slurpee, ICEE, Slush Puppie, Froster and frozen drink machines anywhere in the world. Search by postcode, ZIP code, or city name.',
  keywords: ['slushy','slurpee','ICEE','froster','slush puppie','frozen drink','locator','worldwide'],
  openGraph: {
    title: 'Slush Finder',
    description: 'Find slushy machines anywhere in the world',
    type: 'website',
    images: ['/logo.png'],
  },
  icons: { icon: '/logo.png', apple: '/logo.png' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#00e5ff' },
    { media: '(prefers-color-scheme: light)', color: '#007abc' },
  ],
}

// Inline script to apply theme before paint (avoids flash)
const themeScript = `
  (function(){
    try {
      var t = localStorage.getItem('sf-theme') || 'dark';
      var root = document.documentElement;
      if (t === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
      } else {
        root.classList.add('dark');
        root.classList.remove('light');
      }
    } catch(e) {}
  })();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            className="app-bg min-h-screen">
        <ThemeInit />
        <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl mx-auto min-h-screen app-bg relative">
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  )
}
