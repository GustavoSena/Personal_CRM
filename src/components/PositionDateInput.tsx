'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock } from 'lucide-react'

type DateMode = 'dates' | 'duration'
type DatePrecision = 'month' | 'year'

interface PositionDates {
  fromDate: string | null
  untilDate: string | null
  duration: string | null
}

interface PositionDateInputProps {
  value: PositionDates
  onChange: (dates: PositionDates) => void
  isActive: boolean
}

const months = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

// Generate years from 1970 to current year + 5
const currentYear = new Date().getFullYear()
const years = Array.from({ length: currentYear - 1970 + 6 }, (_, i) => currentYear + 5 - i)

export function PositionDateInput({ value, onChange, isActive }: PositionDateInputProps) {
  const [mode, setMode] = useState<DateMode>('dates')
  const [precision, setPrecision] = useState<DatePrecision>('month')
  
  // From date parts
  const [fromMonth, setFromMonth] = useState('')
  const [fromYear, setFromYear] = useState('')
  
  // Until date parts
  const [untilMonth, setUntilMonth] = useState('')
  const [untilYear, setUntilYear] = useState('')
  
  // Duration text
  const [durationText, setDurationText] = useState('')

  // Initialize from existing values (stored as YYYY-MM-DD in SQL)
  useEffect(() => {
    if (value.duration) {
      setMode('duration')
      setDurationText(value.duration)
    } else if (value.fromDate || value.untilDate) {
      setMode('dates')

      // Parse YYYY-MM-DD format from database
      if (value.fromDate) {
        const parts = value.fromDate.split('-')
        if (parts.length >= 2) {
          setFromYear(parts[0])
          setFromMonth(parts[1])
          // If month is 01, could be year-only, but default to month precision
          setPrecision('month')
        }
      }

      if (value.untilDate) {
        const parts = value.untilDate.split('-')
        if (parts.length >= 2) {
          setUntilYear(parts[0])
          setUntilMonth(parts[1])
        }
      }
    }
  }, [])

  // Build date string for SQL storage – always YYYY-MM-01 format
  const buildDateString = (year: string, month: string): string | null => {
    if (!year) return null

    if (precision === 'year') {
      // Year only → store as January 1st
      return `${year}-01-01`
    }

    if (month) {
      // Month + Year → store as 1st of that month
      return `${year}-${month}-01`
    }

    // Fallback: month not chosen yet, use January 1st
    return `${year}-01-01`
  }

  // Update parent when dates change
  useEffect(() => {
    if (mode === 'dates') {
      const fromDate = buildDateString(fromYear, fromMonth)
      const untilDate = isActive ? null : buildDateString(untilYear, untilMonth)
      onChange({ fromDate, untilDate, duration: null })
    }
  }, [mode, precision, fromMonth, fromYear, untilMonth, untilYear, isActive])

  // Update parent when duration changes
  useEffect(() => {
    if (mode === 'duration') {
      onChange({ fromDate: null, untilDate: null, duration: durationText || null })
    }
  }, [mode, durationText])

  const handleModeChange = (newMode: DateMode) => {
    setMode(newMode)
    if (newMode === 'dates') {
      setDurationText('')
    } else {
      setFromMonth('')
      setFromYear('')
      setUntilMonth('')
      setUntilYear('')
    }
  }

  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleModeChange('dates')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            mode === 'dates'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Dates
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('duration')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            mode === 'duration'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}
        >
          <Clock className="w-4 h-4" />
          Duration
        </button>
      </div>

      {mode === 'dates' ? (
        <div className="space-y-3">
          {/* Precision Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPrecision('month')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                precision === 'month'
                  ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-800'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              Month & Year
            </button>
            <button
              type="button"
              onClick={() => setPrecision('year')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                precision === 'year'
                  ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-800'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              Year Only
            </button>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              From
            </label>
            <div className="flex gap-2">
              {precision === 'month' && (
                <select
                  value={fromMonth}
                  onChange={(e) => setFromMonth(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">Month</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              )}
              <select
                value={fromYear}
                onChange={(e) => setFromYear(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="">Year</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Until Date - only show if not active */}
          {!isActive && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Until
              </label>
              <div className="flex gap-2">
                {precision === 'month' && (
                  <select
                    value={untilMonth}
                    onChange={(e) => setUntilMonth(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="">Month</option>
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                )}
                <select
                  value={untilYear}
                  onChange={(e) => setUntilYear(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {isActive && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              End date not needed for current positions
            </p>
          )}
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={durationText}
            onChange={(e) => setDurationText(e.target.value)}
            placeholder="e.g., 2 years 3 months, or 2020-2023"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Free-form text for duration or date range
          </p>
        </div>
      )}
    </div>
  )
}
