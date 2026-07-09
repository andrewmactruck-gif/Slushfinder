'use client'
import { useState, useEffect } from 'react'
import { toggleTheme, getStoredTheme, applyTheme, Theme } from '@/lib/theme'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const stored = getStoredTheme()
    setTheme(stored)
    applyTheme(stored)
  }, [])

  const handleToggle = () => {
    const next = toggleTheme()
    setTheme(next)
  }

  return (
    <button
      onClick={handleToggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="flex items-center justify-center w-8 h-8 rounded-full border transition-colors"
      style={{
        background: theme === 'light' ? '#e8eef5' : '#1e2229',
        borderColor: theme === 'light' ? '#d0dbe8' : '#1e2840',
        color: theme === 'light' ? '#007abc' : '#00e5ff',
      }}
    >
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
