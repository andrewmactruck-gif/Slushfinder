import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
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
    var t = localStorage.getItem('sf-theme') || 'dark';
    document.documentElement.classList.add(t === 'light' ? 'light' : 'dark');
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
        <div className="max-w-md mx-auto min-h-screen app-bg shadow-xl relative">
          {children}
        </div>
      </body>
    </html>
  )
}
