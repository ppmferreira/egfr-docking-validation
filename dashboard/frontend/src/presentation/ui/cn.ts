import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Joins class names and lets the later Tailwind utility win over an earlier conflicting one. */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs))
