import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSpaces } from '../contexts/SpacesContext'
import { useAuth } from '../contexts/AuthContext'
import CreateSpaceModal from '../components/CreateSpaceModal'
import EditSpaceModal from '../components/EditSpaceModal'
import {
  Plus,
  Snowflake,
  Calculator,
  Code,
  FlaskConical,
  Languages,
  Landmark,
  Brain,
  BookOpen,
  MoreVertical,
  Clock,
  MessageSquare,
  Layers,
  ArrowRight,
  Check,
  Pencil,
  Trash2
} from 'lucide-react'

const iconMap = {
  calculator: Calculator,
  code: Code,
  flask: FlaskConical,
  languages: Languages,
  landmark: Landmark,
  brain: Brain,
  default: BookOpen
}

export default function Home() {
  const { spaces, getConversation, getSources, getAllFlashcards, getFlashcards, getAllSpaces, removeSpace } = useSpaces()
  const { user } = useAuth()
  const [showCreate, setShowCreate] = useState(false)
  const [editingSpace, setEditingSpace] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)

  const allFlashcards = getAllFlashcards()
  const masteredCount = allFlashcards.filter(c => c.mastered).length
  const learningCount = allFlashcards.length - masteredCount

  // Get all spaces (including defaults) that have flashcards
  const spacesWithFlashcards = getAllSpaces().filter(space => getFlashcards(space.id).length > 0)

  const handleDeleteSpace = (spaceId, spaceName) => {
    if (confirm(`Delete "${spaceName}"? This will remove all conversations, sources, and flashcards.`)) {
      removeSpace(spaceId)
      setOpenMenuId(null)
    }
  }

  const handleEditSpace = (space) => {
    setEditingSpace(space)
    setOpenMenuId(null)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-greeting">
          <h1>{getGreeting()}, {firstName}</h1>
          <p>What would you like to learn today?</p>
        </div>
      </header>

      <section className="dashboard-section">
        <div className="section-title">
          <h2>Your Spaces</h2>
          <span className="section-count">{spaces.length}</span>
        </div>

        {spaces.length === 0 ? (
          <div className="empty-spaces">
            <div className="empty-spaces-content">
              <Layers size={48} />
              <h3>No spaces yet</h3>
              <p>Create your first learning space or explore popular topics to get started.</p>
              <div className="empty-spaces-actions">
                <button className="btn-primary" onClick={() => setShowCreate(true)}>
                  <Plus size={18} />
                  <span>Create Space</span>
                </button>
                <Link to="/explore" className="btn-secondary">
                  <span>Explore Topics</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="notebooks-grid">
            <button className="notebook-create" onClick={() => setShowCreate(true)}>
              <div className="create-icon">
                <Plus size={28} strokeWidth={1.5} />
              </div>
              <span className="create-text">New space</span>
            </button>

            {spaces.map(space => {
              const Icon = iconMap[space.icon] || iconMap.default
              const conversation = getConversation(space.id)
              const sources = getSources(space.id)
              const hasActivity = conversation.length > 0
              const isMenuOpen = openMenuId === space.id

              return (
                <div
                  key={space.id}
                  className="notebook-card-wrapper"
                >
                  <Link
                    to={`/space/${space.id}`}
                    className="notebook-card"
                    style={{ '--notebook-color': space.color }}
                  >
                    <div className="notebook-header">
                      <div className="notebook-icon">
                        <Icon size={22} />
                      </div>
                    </div>

                    <div className="notebook-content">
                      <h3>{space.name}</h3>
                      <p>{space.description}</p>
                    </div>

                    <div className="notebook-meta">
                      {hasActivity ? (
                        <>
                          <div className="meta-item">
                            <MessageSquare size={12} />
                            <span>{conversation.length}</span>
                          </div>
                          {sources.length > 0 && (
                            <div className="meta-item">
                              <BookOpen size={12} />
                              <span>{sources.length}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="meta-item meta-empty">
                          <Clock size={12} />
                          <span>Not started</span>
                        </div>
                      )}
                    </div>

                    <div className="notebook-accent" />
                  </Link>

                  <button
                    className="notebook-menu"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setOpenMenuId(isMenuOpen ? null : space.id)
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div
                        className="notebook-menu-backdrop"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="notebook-dropdown">
                        <button
                          className="dropdown-item"
                          onClick={() => handleEditSpace(space)}
                        >
                          <Pencil size={16} />
                          <span>Edit space</span>
                        </button>
                        <button
                          className="dropdown-item dropdown-item-danger"
                          onClick={() => handleDeleteSpace(space.id, space.name)}
                        >
                          <Trash2 size={16} />
                          <span>Delete space</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Flashcards Section */}
      {allFlashcards.length > 0 && (
        <section className="dashboard-section">
          <div className="section-title">
            <h2>Flashcards</h2>
            <span className="section-count">{allFlashcards.length}</span>
          </div>

          <div className="flashcard-overview">
            <div className="overview-stats">
              <div className="overview-stat">
                <Layers size={24} />
                <div className="overview-stat-info">
                  <span className="overview-stat-value">{allFlashcards.length}</span>
                  <span className="overview-stat-label">Total Cards</span>
                </div>
              </div>
              <div className="overview-stat overview-stat-success">
                <Check size={24} />
                <div className="overview-stat-info">
                  <span className="overview-stat-value">{masteredCount}</span>
                  <span className="overview-stat-label">Mastered</span>
                </div>
              </div>
              <div className="overview-stat overview-stat-pending">
                <Layers size={24} />
                <div className="overview-stat-info">
                  <span className="overview-stat-value">{learningCount}</span>
                  <span className="overview-stat-label">Learning</span>
                </div>
              </div>
            </div>

            <div className="flashcard-spaces">
              {spacesWithFlashcards.map(space => {
                const Icon = iconMap[space.icon] || iconMap.default
                const cards = getFlashcards(space.id)
                const mastered = cards.filter(c => c.mastered).length

                return (
                  <Link
                    key={space.id}
                    to={`/space/${space.id}`}
                    className="flashcard-space-link"
                    style={{ '--space-color': space.color }}
                  >
                    <div className="flashcard-space-icon">
                      <Icon size={18} />
                    </div>
                    <div className="flashcard-space-info">
                      <span className="flashcard-space-name">{space.name}</span>
                      <span className="flashcard-space-count">
                        {cards.length} cards · {mastered} mastered
                      </span>
                    </div>
                    <ArrowRight size={16} className="flashcard-space-arrow" />
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      <section className="dashboard-section">
        <div className="section-title">
          <h2>Quick Actions</h2>
        </div>

        <div className="quick-actions">
          <Link to="/explore" className="quick-action">
            <div className="quick-action-icon">
              <Snowflake size={20} />
            </div>
            <div className="quick-action-text">
              <span className="quick-action-title">Explore Topics</span>
              <span className="quick-action-desc">Discover new subjects</span>
            </div>
          </Link>
        </div>
      </section>

      {showCreate && <CreateSpaceModal onClose={() => setShowCreate(false)} />}
      {editingSpace && <EditSpaceModal space={editingSpace} onClose={() => setEditingSpace(null)} />}
    </div>
  )
}
