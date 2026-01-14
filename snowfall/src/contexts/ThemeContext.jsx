import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const THEMES = {
  light: {
    name: 'Light',
    type: 'light'
  },
  dark: {
    name: 'Dark',
    type: 'dark'
  },
  nord: {
    name: 'Nord',
    type: 'dark'
  },
  catppuccin: {
    name: 'Catppuccin',
    type: 'dark'
  },
  tokyoNight: {
    name: 'Tokyo Night',
    type: 'dark'
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('snowfall-theme')
    return saved || 'light'
  })

  useEffect(() => {
    localStorage.setItem('snowfall-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const cycleTheme = () => {
    const themeKeys = Object.keys(THEMES)
    const currentIndex = themeKeys.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themeKeys.length
    setTheme(themeKeys[nextIndex])
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
