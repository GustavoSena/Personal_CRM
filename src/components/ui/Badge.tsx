import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange' | 'gray'
}

const colors = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

export function Badge({ children, colorScheme = 'blue' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[colorScheme]}`}>
      {children}
    </span>
  )
}

interface BadgeListProps {
  items: string[]
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange' | 'gray'
}

export function BadgeList({ items, colorScheme = 'blue' }: BadgeListProps) {
  if (!items || items.length === 0) return null
  
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {items.map((item) => (
        <Badge key={item} colorScheme={colorScheme}>
          {item}
        </Badge>
      ))}
    </div>
  )
}
