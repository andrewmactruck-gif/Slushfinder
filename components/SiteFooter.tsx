'use client'
import { usePathname } from 'next/navigation'

export default function SiteFooter() {
  const pathname = usePathname()
  if (pathname?.startsWith('/search')) return null
  return (
    <footer style={{
      padding: '24px 20px 96px',
      textAlign: 'center',
      fontSize: 12,
      color: 'var(--t3, #849495)',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ marginBottom: 4 }}>© 2026 SlushFinder</div>
      <div>
        Contact:{' '}
        <a href="mailto:info@slushfinder.com" style={{ color: 'var(--cyan, #00b4cc)', textDecoration: 'none' }}>
          info@slushfinder.com
        </a>
      </div>
      <div style={{ marginTop: 12, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', fontSize: 11, lineHeight: 1.5, color: 'var(--t3, #849495)', opacity: 0.85 }}>
        SlushFinder is just for fun. Locations are user-submitted and may be inaccurate or out of date. Please verify a location before visiting, and always use your own judgment to stay safe.
      </div>
    </footer>
  )
}
