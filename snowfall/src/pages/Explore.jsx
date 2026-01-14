import { useState } from 'react'
import { useSpaces, DEFAULT_SPACES } from '../contexts/SpacesContext'
import SpaceCard from '../components/SpaceCard'
import CreateSpaceModal from '../components/CreateSpaceModal'
import { Search } from 'lucide-react'

const SUGGESTED_TOPICS = [
  'Quantum Physics',
  'Web Development',
  'Creative Writing',
  'Data Science',
  'Music Theory',
  'Psychology',
  'Economics',
  'Art History'
]

export default function Explore() {
  const { spaces } = useSpaces()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState('')

  // Filter default spaces based on search
  const filteredDefaultSpaces = DEFAULT_SPACES.filter(space =>
    space.name.toLowerCase().includes(search.toLowerCase()) ||
    space.description.toLowerCase().includes(search.toLowerCase())
  )

  // Filter user-created spaces based on search
  const filteredUserSpaces = spaces.filter(space =>
    space.name.toLowerCase().includes(search.toLowerCase()) ||
    space.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic)
    setShowCreate(true)
  }

  const handleCloseModal = () => {
    setShowCreate(false)
    setSelectedTopic('')
  }

  return (
    <div className="explore">
      <header className="explore-header">
        <h1>Explore Topics</h1>
        <p>Discover new subjects and expand your knowledge</p>

        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search for a topic..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </header>

      <section className="explore-section">
        <h2>Popular Topics</h2>
        <div className="spaces-grid">
          {filteredDefaultSpaces.map(space => (
            <SpaceCard key={space.id} space={space} />
          ))}
        </div>
      </section>

      {filteredUserSpaces.length > 0 && (
        <section className="explore-section">
          <h2>Your Custom Spaces</h2>
          <div className="spaces-grid">
            {filteredUserSpaces.map(space => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        </section>
      )}

      <section className="explore-section">
        <h2>Suggested Topics</h2>
        <p className="explore-hint">Click to create a new space for any of these topics</p>
        <div className="suggestions">
          {SUGGESTED_TOPICS.map(topic => (
            <button
              key={topic}
              className="suggestion-tag"
              onClick={() => handleTopicClick(topic)}
            >
              {topic}
            </button>
          ))}
        </div>
      </section>

      {showCreate && (
        <CreateSpaceModal
          onClose={handleCloseModal}
          initialName={selectedTopic}
        />
      )}
    </div>
  )
}
