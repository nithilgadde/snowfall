import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'

const SpacesContext = createContext()

// Helper to get user-scoped storage key
const getStorageKey = (userId, key) => {
  if (!userId) return null
  return `snowfall-${key}-${userId}`
}

// Default/template spaces shown in Explore
export const DEFAULT_SPACES = [
  {
    id: 'mathematics',
    name: 'Mathematics',
    description: 'Algebra, calculus, geometry, and more',
    icon: 'calculator',
    color: '#6366f1',
    isDefault: true
  },
  {
    id: 'programming',
    name: 'Programming',
    description: 'Learn to code in any language',
    icon: 'code',
    color: '#10b981',
    isDefault: true
  },
  {
    id: 'science',
    name: 'Science',
    description: 'Physics, chemistry, biology',
    icon: 'flask',
    color: '#f59e0b',
    isDefault: true
  },
  {
    id: 'languages',
    name: 'Languages',
    description: 'Learn new languages and grammar',
    icon: 'languages',
    color: '#ec4899',
    isDefault: true
  },
  {
    id: 'history',
    name: 'History',
    description: 'World history and civilizations',
    icon: 'landmark',
    color: '#8b5cf6',
    isDefault: true
  },
  {
    id: 'philosophy',
    name: 'Philosophy',
    description: 'Logic, ethics, and metaphysics',
    icon: 'brain',
    color: '#06b6d4',
    isDefault: true
  }
]

export function SpacesProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id

  // Initialize with empty state - will be loaded when user is available
  const [spaces, setSpaces] = useState([])
  const [conversations, setConversations] = useState({})
  const [sources, setSources] = useState({})
  const [flashcards, setFlashcards] = useState({})
  const [wrongAnswers, setWrongAnswers] = useState({})
  const [isLoaded, setIsLoaded] = useState(false)

  // Load data when user changes
  useEffect(() => {
    if (!userId) {
      // Clear all data when logged out
      setSpaces([])
      setConversations({})
      setSources({})
      setFlashcards({})
      setWrongAnswers({})
      setIsLoaded(false)
      return
    }

    // Load user-specific data
    const spacesKey = getStorageKey(userId, 'spaces')
    const conversationsKey = getStorageKey(userId, 'conversations')
    const sourcesKey = getStorageKey(userId, 'sources')
    const flashcardsKey = getStorageKey(userId, 'flashcards')
    const wrongAnswersKey = getStorageKey(userId, 'wrong-answers')

    const savedSpaces = localStorage.getItem(spacesKey)
    if (savedSpaces) {
      const parsed = JSON.parse(savedSpaces)
      setSpaces(parsed.filter(s => !DEFAULT_SPACES.find(d => d.id === s.id) || s.isDefault === false))
    } else {
      setSpaces([])
    }

    const savedConversations = localStorage.getItem(conversationsKey)
    setConversations(savedConversations ? JSON.parse(savedConversations) : {})

    const savedSources = localStorage.getItem(sourcesKey)
    setSources(savedSources ? JSON.parse(savedSources) : {})

    const savedFlashcards = localStorage.getItem(flashcardsKey)
    setFlashcards(savedFlashcards ? JSON.parse(savedFlashcards) : {})

    const savedWrongAnswers = localStorage.getItem(wrongAnswersKey)
    setWrongAnswers(savedWrongAnswers ? JSON.parse(savedWrongAnswers) : {})

    setIsLoaded(true)
  }, [userId])

  // Save data when it changes (only if user is logged in and data is loaded)
  useEffect(() => {
    if (!userId || !isLoaded) return
    const key = getStorageKey(userId, 'spaces')
    if (key) localStorage.setItem(key, JSON.stringify(spaces))
  }, [spaces, userId, isLoaded])

  useEffect(() => {
    if (!userId || !isLoaded) return
    const key = getStorageKey(userId, 'conversations')
    if (key) localStorage.setItem(key, JSON.stringify(conversations))
  }, [conversations, userId, isLoaded])

  useEffect(() => {
    if (!userId || !isLoaded) return
    const key = getStorageKey(userId, 'sources')
    if (key) localStorage.setItem(key, JSON.stringify(sources))
  }, [sources, userId, isLoaded])

  useEffect(() => {
    if (!userId || !isLoaded) return
    const key = getStorageKey(userId, 'flashcards')
    if (key) localStorage.setItem(key, JSON.stringify(flashcards))
  }, [flashcards, userId, isLoaded])

  useEffect(() => {
    if (!userId || !isLoaded) return
    const key = getStorageKey(userId, 'wrong-answers')
    if (key) localStorage.setItem(key, JSON.stringify(wrongAnswers))
  }, [wrongAnswers, userId, isLoaded])

  const addSpace = (space) => {
    const newSpace = {
      ...space,
      id: space.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      color: space.color || '#6366f1'
    }
    setSpaces(prev => [...prev, newSpace])
    return newSpace
  }

  const updateSpace = (id, updates) => {
    setSpaces(prev => prev.map(space =>
      space.id === id ? { ...space, ...updates } : space
    ))
  }

  const removeSpace = (id) => {
    setSpaces(prev => prev.filter(s => s.id !== id))
    setConversations(prev => {
      const { [id]: removed, ...rest } = prev
      return rest
    })
    setSources(prev => {
      const { [id]: removed, ...rest } = prev
      return rest
    })
    setFlashcards(prev => {
      const { [id]: removed, ...rest } = prev
      return rest
    })
    setWrongAnswers(prev => {
      const { [id]: removed, ...rest } = prev
      return rest
    })
  }

  const getConversation = (spaceId) => {
    return conversations[spaceId] || []
  }

  const addMessage = (spaceId, message) => {
    setConversations(prev => ({
      ...prev,
      [spaceId]: [...(prev[spaceId] || []), message]
    }))
  }

  const clearConversation = (spaceId) => {
    setConversations(prev => ({
      ...prev,
      [spaceId]: []
    }))
  }

  // Sources management
  const getSources = (spaceId) => {
    return sources[spaceId] || []
  }

  const addSource = (spaceId, source) => {
    const newSource = {
      ...source,
      id: Date.now().toString(),
      addedAt: new Date().toISOString()
    }
    setSources(prev => ({
      ...prev,
      [spaceId]: [...(prev[spaceId] || []), newSource]
    }))
    return newSource
  }

  const removeSource = (spaceId, sourceId) => {
    setSources(prev => ({
      ...prev,
      [spaceId]: (prev[spaceId] || []).filter(s => s.id !== sourceId)
    }))
  }

  const updateSource = (spaceId, sourceId, updates) => {
    setSources(prev => ({
      ...prev,
      [spaceId]: (prev[spaceId] || []).map(s =>
        s.id === sourceId ? { ...s, ...updates } : s
      )
    }))
  }

  // Flashcard management
  const getFlashcards = (spaceId) => {
    return flashcards[spaceId] || []
  }

  const addFlashcards = (spaceId, newCards) => {
    const cardsWithIds = newCards.map(card => ({
      ...card,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      mastered: false
    }))
    setFlashcards(prev => ({
      ...prev,
      [spaceId]: [...(prev[spaceId] || []), ...cardsWithIds]
    }))
    return cardsWithIds
  }

  const updateFlashcard = (spaceId, cardId, updates) => {
    setFlashcards(prev => ({
      ...prev,
      [spaceId]: (prev[spaceId] || []).map(c =>
        c.id === cardId ? { ...c, ...updates } : c
      )
    }))
  }

  const removeFlashcard = (spaceId, cardId) => {
    setFlashcards(prev => ({
      ...prev,
      [spaceId]: (prev[spaceId] || []).filter(c => c.id !== cardId)
    }))
  }

  const clearFlashcards = (spaceId) => {
    setFlashcards(prev => ({
      ...prev,
      [spaceId]: []
    }))
  }

  // Get all flashcards across all spaces
  const getAllFlashcards = () => {
    const all = []
    const allSpaces = [...spaces, ...DEFAULT_SPACES]
    Object.entries(flashcards).forEach(([spaceId, cards]) => {
      const space = allSpaces.find(s => s.id === spaceId)
      cards.forEach(card => {
        all.push({ ...card, spaceId, spaceName: space?.name || spaceId })
      })
    })
    return all
  }

  // Get all spaces (user-created + defaults for lookup)
  const getAllSpaces = () => {
    return [...spaces, ...DEFAULT_SPACES]
  }

  // Find a space by ID (checks both user and default spaces)
  const getSpaceById = (id) => {
    return spaces.find(s => s.id === id) || DEFAULT_SPACES.find(s => s.id === id)
  }

  // Wrong answers management (for quiz improvement)
  const getWrongAnswers = (spaceId) => {
    return wrongAnswers[spaceId] || []
  }

  const addWrongAnswer = (spaceId, wrongAnswer) => {
    const newWrongAnswer = {
      ...wrongAnswer,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    }
    setWrongAnswers(prev => ({
      ...prev,
      [spaceId]: [...(prev[spaceId] || []).slice(-19), newWrongAnswer] // Keep last 20
    }))
  }

  const clearWrongAnswers = (spaceId) => {
    setWrongAnswers(prev => ({
      ...prev,
      [spaceId]: []
    }))
  }

  return (
    <SpacesContext.Provider value={{
      spaces,
      addSpace,
      updateSpace,
      removeSpace,
      getConversation,
      addMessage,
      clearConversation,
      getSources,
      addSource,
      removeSource,
      updateSource,
      getFlashcards,
      addFlashcards,
      updateFlashcard,
      removeFlashcard,
      clearFlashcards,
      getAllFlashcards,
      getAllSpaces,
      getSpaceById,
      getWrongAnswers,
      addWrongAnswer,
      clearWrongAnswers
    }}>
      {children}
    </SpacesContext.Provider>
  )
}

export const useSpaces = () => useContext(SpacesContext)
