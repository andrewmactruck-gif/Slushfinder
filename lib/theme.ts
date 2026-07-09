// Theme utility — client-side only
export type Theme = 'dark' | 'light'

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return (localStorage.getItem('sf-theme') as Theme) ?? 'dark'
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.add('theme-transition')
  if (theme === 'light') {
    root.classList.add('light')
    root.classList.remove('dark')
  } else {
    root.classList.add('dark')
    root.classList.remove('light')
  }
  setTimeout(() => root.classList.remove('theme-transition'), 400)
  localStorage.setItem('sf-theme', theme)
}

export function toggleTheme(): Theme {
  const current = getStoredTheme()
  const next: Theme = current === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  return next
}
