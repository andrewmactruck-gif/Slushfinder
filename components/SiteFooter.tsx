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
    </footer>
  )
}
