'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

interface TopicsQuickAddProps {
  personId: number
  currentTopics: string[]
}

export function TopicsQuickAdd({ personId, currentTopics }: TopicsQuickAddProps) {
  const router = useRouter()
  const [topics, setTopics] = useState<string[]>(currentTopics)
  const [inputValue, setInputValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const addTopic = async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || topics.includes(trimmed)) {
      setInputValue('')
      return
    }

    setIsAdding(true)
    const newTopics = [...topics, trimmed]

    try {
      const { error } = await supabase
        .from('people')
        .update({ skills_topics: newTopics })
        .eq('id', personId)

      if (error) throw error

      setTopics(newTopics)
      setInputValue('')
      router.refresh()
    } catch (error) {
      console.error('Error adding topic:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const removeTopic = async (topicToRemove: string) => {
    setIsRemoving(topicToRemove)
    const newTopics = topics.filter(t => t !== topicToRemove)

    try {
      const { error } = await supabase
        .from('people')
        .update({ skills_topics: newTopics.length > 0 ? newTopics : null })
        .eq('id', personId)

      if (error) throw error

      setTopics(newTopics)
      router.refresh()
    } catch (error) {
      console.error('Error removing topic:', error)
    } finally {
      setIsRemoving(null)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTopic()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skills & Topics</h2>
      
      {/* Existing topics */}
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {topics.map((topic) => (
            <span
              key={topic}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {topic}
              <button
                onClick={() => removeTopic(topic)}
                disabled={isRemoving === topic}
                className="ml-1 hover:text-blue-600 dark:hover:text-blue-100 transition-colors"
              >
                {isRemoving === topic ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add new topic */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a topic..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <button
          onClick={addTopic}
          disabled={isAdding || !inputValue.trim()}
          className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1"
        >
          {isAdding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add
        </button>
      </div>
    </div>
  )
}
