import Link from 'next/link'
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  href?: string
  className?: string
}

export function Card({ children, href, className = '' }: CardProps) {
  const baseStyles = `bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`
  
  if (href) {
    return (
      <Link href={href} className={`${baseStyles} hover:shadow-md transition-shadow block`}>
        {children}
      </Link>
    )
  }

  return <div className={baseStyles}>{children}</div>
}

interface CardHeaderProps {
  title: string
  subtitle?: string
}

export function CardHeader({ title, subtitle }: CardHeaderProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  )
}
