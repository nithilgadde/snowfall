import { useState, useEffect } from 'react'
import { generateExercise } from '../services/groq'
import Exercise from './Exercise'
import { RefreshCw, Loader, AlertCircle, MessageSquare } from 'lucide-react'

export default function ExercisePanel({ space, model, aiAvailable, conversation }) {
  const [exercise, setExercise] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [difficulty, setDifficulty] = useState('medium')
  const [previousQuestions, setPreviousQuestions] = useState([])

  const hasConversation = conversation && conversation.length > 0

  const handleGenerate = async () => {
    if (!aiAvailable) return
    setLoading(true)
    setError(null)

    try {
      const newExercise = await generateExercise(model, space.name, difficulty, conversation, previousQuestions)
      setExercise(newExercise)
      // Track this question to avoid repeats (keep last 10)
      setPreviousQuestions(prev => [...prev.slice(-9), newExercise.question])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate first exercise when panel loads (only if there's conversation)
  useEffect(() => {
    if (aiAvailable && !exercise && !loading && hasConversation) {
      handleGenerate()
    }
  }, [aiAvailable, hasConversation])

  if (!aiAvailable) {
    return (
      <div className="exercise-panel">
        <div className="ai-warning">
          <AlertCircle size={20} />
          <div>
            <strong>AI required for exercises</strong>
            <p>Set your GROQ_API_KEY to generate practice problems.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!hasConversation) {
    return (
      <div className="exercise-panel">
        <div className="empty-state">
          <MessageSquare size={48} />
          <h3>Start Learning First</h3>
          <p>Chat with Oracle about {space.name} to unlock personalized practice problems based on what you're learning.</p>
        </div>
      </div>
    )
  }

  if (loading && !exercise) {
    return (
      <div className="exercise-panel">
        <div className="empty-state">
          <Loader size={48} className="spin" />
          <h3>Generating Exercise</h3>
          <p>Creating a practice problem based on your conversation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="exercise-panel">
      {error && (
        <div className="exercise-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="btn-secondary" onClick={handleGenerate} style={{ marginLeft: 'auto' }}>
            Retry
          </button>
        </div>
      )}

      {exercise && (
        <>
          <Exercise exercise={exercise} onNext={handleGenerate} />

          <div className="exercise-footer">
            <div className="difficulty-selector">
              <label htmlFor="difficulty">Difficulty:</label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <button
              className="btn-primary"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader size={18} className="spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  <span>Next Exercise</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
