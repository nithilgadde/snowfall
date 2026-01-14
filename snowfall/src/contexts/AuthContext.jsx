import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('snowfall-user')
    return saved ? JSON.parse(saved) : null
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate checking auth state
    const timer = setTimeout(() => setIsLoading(false), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (user) {
      localStorage.setItem('snowfall-user', JSON.stringify(user))
    } else {
      localStorage.removeItem('snowfall-user')
    }
  }, [user])

  const signIn = async (email, password) => {
    // Simulate API call - in production, replace with real auth
    await new Promise(resolve => setTimeout(resolve, 800))

    const users = JSON.parse(localStorage.getItem('snowfall-users') || '[]')
    const existingUser = users.find(u => u.email === email)

    if (!existingUser) {
      throw new Error('No account found with this email')
    }

    if (existingUser.password !== password) {
      throw new Error('Incorrect password')
    }

    const userData = {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      avatar: existingUser.avatar
    }

    setUser(userData)
    return userData
  }

  const signUp = async (name, email, password) => {
    // Simulate API call - in production, replace with real auth
    await new Promise(resolve => setTimeout(resolve, 800))

    const users = JSON.parse(localStorage.getItem('snowfall-users') || '[]')

    if (users.find(u => u.email === email)) {
      throw new Error('An account with this email already exists')
    }

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password, // In production, this would be hashed
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1`,
      createdAt: new Date().toISOString()
    }

    users.push(newUser)
    localStorage.setItem('snowfall-users', JSON.stringify(users))

    const userData = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      avatar: newUser.avatar
    }

    setUser(userData)
    return userData
  }

  const signOut = () => {
    setUser(null)
  }

  const updateProfile = (updates) => {
    setUser(prev => ({ ...prev, ...updates }))
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      signIn,
      signUp,
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
