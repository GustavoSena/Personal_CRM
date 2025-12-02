import Link from 'next/link'
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  href?: string
  className?: string
}

/**
 * Render a styled card container that becomes a navigable link when `href` is provided.
 *
 * @param children - Content to display inside the card.
 * @param href - Optional destination URL; when provided the card is rendered as a link.
 * @param className - Optional additional CSS classes appended to the card's base styles.
 * @returns A React element representing the card; an anchor-backed element when `href` is provided, otherwise a div.
 */
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

/**
 * Renders a card header with a title and optional subtitle.
 *
 * @param title - The header title text
 * @param subtitle - Optional secondary text displayed beneath the title
 * @returns The header element containing the title and, if provided, the subtitle
 */
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