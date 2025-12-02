import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combine multiple class value inputs into a single class string with Tailwind class merging.
 *
 * @param inputs - One or more class value inputs (strings, arrays, objects, etc.) to be combined
 * @returns A single string of class names with conflicting Tailwind classes resolved and merged
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}