import { cn } from '@/lib/utils'

interface MaterialIconProps {
  name: string
  className?: string
}

export function MaterialIcon({ name, className }: MaterialIconProps) {
  return <span className={cn('material-symbols-outlined', className)}>{name}</span>
}
