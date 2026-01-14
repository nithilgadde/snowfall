import { useState, useEffect } from 'react'
import { useSpaces } from '../contexts/SpacesContext'
import { generateFlashcards } from '../services/groq'
import {
  Layers,
  Plus,
  Loader,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Trash2,
  Shuffle,
  AlertCircle
} from 'lucide-react'

export default function FlashcardPanel({ space, model, aiAvailable, conversation }) {
  const { getFlashcards, addFlashcards, updateFlashcard, removeFlashcard, clearFlashcards, getSources } = useSpaces()
  const flashcards = getFlashcards(space.id)
  const sources = getSources(space.id)

  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [cardCount, setCardCount] = useState(5)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [studyMode, setStudyMode] = useState(false)
  const [shuffledCards, setShuffledCards] = useState([])

  // Reset flip when changing cards
  useEffect(() => {
    setIsFlipped(false)
  }, [currentIndex])

  // Initialize shuffled cards when entering study mode
  useEffect(() => {
    if (studyMode) {
      setShuffledCards([...flashcards].sort(() => Math.random() - 0.5))
      setCurrentIndex(0)
    }
  }, [studyMode])

  const handleGenerate = async () => {
    if (!aiAvailable) return
    setIsGenerating(true)
    setError(null)

    try {
      const newCards = await generateFlashcards(model, space.name, cardCount, conversation, sources)
      addFlashcards(space.id, newCards)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleNext = () => {
    const cards = studyMode ? shuffledCards : flashcards
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleMarkMastered = (cardId, mastered) => {
    updateFlashcard(space.id, cardId, { mastered })
    // Auto-advance after marking
    handleNext()
  }

  const handleDelete = (cardId) => {
    removeFlashcard(space.id, cardId)
    if (currentIndex >= flashcards.length - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleClearAll = () => {
    if (confirm('Delete all flashcards in this space?')) {
      clearFlashcards(space.id)
      setCurrentIndex(0)
    }
  }

  const handleShuffle = () => {
    setShuffledCards([...flashcards].sort(() => Math.random() - 0.5))
    setCurrentIndex(0)
  }

  const displayCards = studyMode ? shuffledCards : flashcards
  const currentCard = displayCards[currentIndex]
  const masteredCount = flashcards.filter(c => c.mastered).length

  return (
    <div className="flashcard-panel">
      {/* Generation Controls */}
      <div className="flashcard-controls">
        <div className="control-group">
          <label>Number of cards</label>
          <select value={cardCount} onChange={(e) => setCardCount(Number(e.target.value))}>
            <option value={3}>3 cards</option>
            <option value={5}>5 cards</option>
            <option value={10}>10 cards</option>
            <option value={15}>15 cards</option>
            <option value={20}>20 cards</option>
          </select>
        </div>

        <button
          className="btn-primary"
          onClick={handleGenerate}
          disabled={isGenerating || !aiAvailable}
        >
          {isGenerating ? (
            <>
              <Loader size={18} className="spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Plus size={18} />
              <span>Generate Cards</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="flashcard-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {flashcards.length === 0 ? (
        <div className="flashcard-empty">
          <Layers size={48} />
          <h3>No Flashcards Yet</h3>
          <p>
            Generate flashcards from your conversation and sources to test your knowledge.
            {!aiAvailable && ' Connect to AI to generate cards.'}
          </p>
        </div>
      ) : (
        <>
          {/* Stats Bar */}
          <div className="flashcard-stats">
            <div className="stat">
              <span className="stat-value">{flashcards.length}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat">
              <span className="stat-value stat-success">{masteredCount}</span>
              <span className="stat-label">Mastered</span>
            </div>
            <div className="stat">
              <span className="stat-value stat-pending">{flashcards.length - masteredCount}</span>
              <span className="stat-label">Learning</span>
            </div>

            <div className="stat-actions">
              <button
                className={`study-toggle ${studyMode ? 'active' : ''}`}
                onClick={() => setStudyMode(!studyMode)}
              >
                {studyMode ? 'Exit Study' : 'Study Mode'}
              </button>
              {studyMode && (
                <button className="btn-icon" onClick={handleShuffle} title="Shuffle cards">
                  <Shuffle size={18} />
                </button>
              )}
              <button className="btn-icon btn-danger" onClick={handleClearAll} title="Clear all">
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Flashcard Display */}
          <div className="flashcard-viewer">
            <button
              className="nav-arrow nav-prev"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={24} />
            </button>

            <div className="flashcard-container" onClick={handleFlip}>
              <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
                <div className="flashcard-face flashcard-front">
                  {currentCard?.topic && (
                    <span className="flashcard-topic">{currentCard.topic}</span>
                  )}
                  <p className="flashcard-text">{currentCard?.front}</p>
                  <span className="flashcard-hint">Click to flip</span>
                </div>
                <div className="flashcard-face flashcard-back">
                  <p className="flashcard-text">{currentCard?.back}</p>
                  {!studyMode && (
                    <div className="flashcard-actions">
                      <button
                        className="action-btn action-wrong"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkMastered(currentCard.id, false)
                        }}
                        title="Still learning"
                      >
                        <X size={20} />
                      </button>
                      <button
                        className="action-btn action-correct"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkMastered(currentCard.id, true)
                        }}
                        title="Got it!"
                      >
                        <Check size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {currentCard?.mastered && (
                <div className="mastered-badge">
                  <Check size={14} />
                  <span>Mastered</span>
                </div>
              )}
            </div>

            <button
              className="nav-arrow nav-next"
              onClick={handleNext}
              disabled={currentIndex === displayCards.length - 1}
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Progress */}
          <div className="flashcard-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((currentIndex + 1) / displayCards.length) * 100}%` }}
              />
            </div>
            <span className="progress-text">
              {currentIndex + 1} of {displayCards.length}
            </span>
          </div>

          {/* Card List (non-study mode) */}
          {!studyMode && (
            <div className="flashcard-list">
              <h4>All Cards</h4>
              <div className="card-list-grid">
                {flashcards.map((card, idx) => (
                  <div
                    key={card.id}
                    className={`card-list-item ${idx === currentIndex ? 'active' : ''} ${card.mastered ? 'mastered' : ''}`}
                    onClick={() => setCurrentIndex(idx)}
                  >
                    <span className="card-list-num">{idx + 1}</span>
                    <span className="card-list-text">{card.front}</span>
                    {card.mastered && <Check size={14} className="card-list-check" />}
                    <button
                      className="card-list-delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(card.id)
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
