'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'

interface TopicFilterProps {
  topics: string[]
  selectedTopics: string[]
  colorScheme?: 'blue' | 'green'
}

export function TopicFilter({ topics, selectedTopics, colorScheme = 'blue' }: TopicFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const colors = colorScheme === 'blue' 
    ? {
        active: 'bg-blue-600 text-white',
        inactive: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
      }
    : {
        active: 'bg-green-600 text-white',
        inactive: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
      }

  const toggleTopic = (topic: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const currentTopics = params.getAll('topic')
    
    if (currentTopics.includes(topic)) {
      params.delete('topic')
      currentTopics.filter(t => t !== topic).forEach(t => params.append('topic', t))
    } else {
      params.append('topic', topic)
    }
    
    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('topic')
    router.push(`?${params.toString()}`)
  }

  if (topics.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filter by topics:</span>
        {selectedTopics.length > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic) => {
          const isSelected = selectedTopics.includes(topic)
          return (
            <button
              key={topic}
              onClick={() => toggleTopic(topic)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isSelected ? colors.active : colors.inactive
              }`}
            >
              {topic}
            </button>
          )
        })}
      </div>
    </div>
  )
}
