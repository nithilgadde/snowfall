import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Snowflake, Compass, Home, Plus, MessageSquare, Sun, Moon, Palette, LogOut, User } from 'lucide-react'
import { useSpaces } from '../contexts/SpacesContext'
import { useTheme, THEMES } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { getAllSpaces, getConversation } = useSpaces()
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Extract space ID from pathname
  const pathMatch = location.pathname.match(/^\/space\/(.+)/)
  const activeSpaceId = pathMatch ? pathMatch[1] : null

  // Only show spaces that have conversations started (from all spaces including defaults)
  const activeSpaces = getAllSpaces().filter(space => {
    const conversation = getConversation(space.id)
    return conversation && conversation.length > 0
  })

  const currentTheme = THEMES[theme]
  const isLight = theme === 'light'

  const handleSignOut = () => {
    signOut()
    navigate('/landing')
  }

  return (
    <div className="layout">
      <nav className="navbar">
        <Link to="/" className="logo">
          <Snowflake size={24} />
          <span>Snowfall</span>
        </Link>

        <div className="nav-right">
          <div className="nav-links">
            <Link
              to="/"
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              <Home size={18} />
              <span>Home</span>
            </Link>
            <Link
              to="/explore"
              className={`nav-link ${location.pathname === '/explore' ? 'active' : ''}`}
            >
              <Compass size={18} />
              <span>Explore</span>
            </Link>
          </div>

          <div className="theme-selector">
            <button
              className="theme-toggle"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              title="Change theme"
            >
              {isLight ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {showThemeMenu && (
              <>
                <div className="theme-menu-backdrop" onClick={() => setShowThemeMenu(false)} />
                <div className="theme-menu">
                  <div className="theme-menu-header">Theme</div>
                  {Object.entries(THEMES).map(([key, value]) => (
                    <button
                      key={key}
                      className={`theme-option ${theme === key ? 'active' : ''}`}
                      onClick={() => {
                        setTheme(key)
                        setShowThemeMenu(false)
                      }}
                    >
                      <span className="theme-option-icon">
                        {value.type === 'light' ? <Sun size={16} /> : <Palette size={16} />}
                      </span>
                      <span>{value.name}</span>
                      {theme === key && <span className="theme-check">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="user-menu-container">
            <button
              className="user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="user-avatar" />
              ) : (
                <div className="user-avatar-placeholder">
                  <User size={18} />
                </div>
              )}
            </button>

            {showUserMenu && (
              <>
                <div className="user-menu-backdrop" onClick={() => setShowUserMenu(false)} />
                <div className="user-menu">
                  <div className="user-menu-header">
                    <span className="user-menu-name">{user?.name}</span>
                    <span className="user-menu-email">{user?.email}</span>
                  </div>
                  <button className="user-menu-option" onClick={handleSignOut}>
                    <LogOut size={16} />
                    <span>Sign out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="layout-body">
        <aside className="sidebar">
          <div className="sidebar-header">
            <span>Recent</span>
            <Link to="/" className="sidebar-add" title="Start new space">
              <Plus size={16} />
            </Link>
          </div>

          <nav className="sidebar-nav">
            {activeSpaces.map(space => (
              <Link
                key={space.id}
                to={`/space/${space.id}`}
                className={`sidebar-item ${activeSpaceId === space.id ? 'active' : ''}`}
                style={{ '--space-color': space.color }}
              >
                <span
                  className="sidebar-item-dot"
                  style={{ background: space.color }}
                />
                <span className="sidebar-item-name">{space.name}</span>
              </Link>
            ))}
          </nav>

          {activeSpaces.length === 0 && (
            <div className="sidebar-empty">
              <MessageSquare size={20} />
              <p>No chats yet</p>
              <span className="sidebar-empty-hint">Start a conversation in any space</span>
            </div>
          )}
        </aside>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
