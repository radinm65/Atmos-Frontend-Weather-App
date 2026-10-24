import { Moon, Sun } from 'lucide-react'
import { IconButton } from '../../components/ui/IconButton'
import { useTheme } from './useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <IconButton
      label={`Switch to ${next} theme`}
      icon={theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      onClick={toggleTheme}
    />
  )
}
