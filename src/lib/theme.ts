export function getThemeScript(): string {
  return `
    (function() {
      function getTheme() {
        const stored = localStorage.getItem('theme')
        if (stored === 'light' || stored === 'dark') return stored
        return 'system'
      }
      
      function applyTheme(theme) {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const isDark = theme === 'dark' || (theme === 'system' && systemDark)
        
        if (isDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
      
      applyTheme(getTheme())
    })()
  `.trim()
}
