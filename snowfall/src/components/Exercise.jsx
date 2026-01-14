import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Check, X, Lightbulb, ArrowRight } from 'lucide-react'

export default function Exercise({ exercise, onNext }) {
  const [selected, setSelected] = useState(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const isCorrect = () => {
    if (exercise.type === 'multiple_choice') {
      return selected === exercise.answer
    }
    if (exercise.type === 'true_false') {
      return selected?.toLowerCase() === exercise.answer?.toLowerCase()
    }
    // For short answer, do a fuzzy match
    return textAnswer.toLowerCase().trim() === exercise.answer?.toLowerCase().trim()
  }

  const handleSubmit = () => {
    if (exercise.type === 'short_answer' && !textAnswer.trim()) return
    if ((exercise.type === 'multiple_choice' || exercise.type === 'true_false') && !selected) return
    setSubmitted(true)
  }

  const handleNext = () => {
    setSelected(null)
    setTextAnswer('')
    setSubmitted(false)
    setShowHint(false)
    onNext()
  }

  const renderContent = (content) => (
    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
      {content}
    </ReactMarkdown>
  )

  return (
    <div className={`exercise ${submitted ? (isCorrect() ? 'correct' : 'incorrect') : ''}`}>
      {exercise.topic && (
        <div className="exercise-topic">
          {exercise.topic}
        </div>
      )}
      <div className="exercise-question">
        {renderContent(exercise.question)}
      </div>

      {exercise.type === 'multiple_choice' && exercise.options && (
        <div className="exercise-options">
          {exercise.options.map((option, i) => (
            <button
              key={i}
              className={`option ${selected === option ? 'selected' : ''} ${
                submitted ? (option === exercise.answer ? 'correct' : selected === option ? 'incorrect' : '') : ''
              }`}
              onClick={() => !submitted && setSelected(option)}
              disabled={submitted}
            >
              <span className="option-letter">{String.fromCharCode(65 + i)}</span>
              <span className="option-text">{renderContent(option)}</span>
              {submitted && option === exercise.answer && <Check size={18} className="option-icon correct" />}
              {submitted && selected === option && option !== exercise.answer && <X size={18} className="option-icon incorrect" />}
            </button>
          ))}
        </div>
      )}

      {exercise.type === 'true_false' && (
        <div className="exercise-options true-false">
          {['True', 'False'].map(option => (
            <button
              key={option}
              className={`option ${selected === option ? 'selected' : ''} ${
                submitted ? (option.toLowerCase() === exercise.answer?.toLowerCase() ? 'correct' : selected === option ? 'incorrect' : '') : ''
              }`}
              onClick={() => !submitted && setSelected(option)}
              disabled={submitted}
            >
              <span className="option-text">{option}</span>
            </button>
          ))}
        </div>
      )}

      {exercise.type === 'short_answer' && (
        <div className="exercise-input">
          <input
            type="text"
            value={textAnswer}
            onChange={e => setTextAnswer(e.target.value)}
            placeholder="Type your answer..."
            disabled={submitted}
            onKeyDown={e => e.key === 'Enter' && !submitted && handleSubmit()}
          />
          {submitted && (
            <div className={`answer-feedback ${isCorrect() ? 'correct' : 'incorrect'}`}>
              {isCorrect() ? <Check size={18} /> : <X size={18} />}
              <span>Correct answer: {exercise.answer}</span>
            </div>
          )}
        </div>
      )}

      {!submitted && exercise.hint && (
        <button className="hint-btn" onClick={() => setShowHint(!showHint)}>
          <Lightbulb size={16} />
          <span>{showHint ? 'Hide hint' : 'Show hint'}</span>
        </button>
      )}

      {showHint && !submitted && (
        <div className="hint-box">
          {renderContent(exercise.hint)}
        </div>
      )}

      {submitted && exercise.explanation && (
        <div className="explanation-box">
          <strong>Explanation:</strong>
          {renderContent(exercise.explanation)}
        </div>
      )}

      <div className="exercise-actions">
        {!submitted ? (
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={
              (exercise.type === 'short_answer' && !textAnswer.trim()) ||
              ((exercise.type === 'multiple_choice' || exercise.type === 'true_false') && !selected)
            }
          >
            <Check size={18} />
            <span>Check Answer</span>
          </button>
        ) : (
          <button className="btn-primary" onClick={handleNext}>
            <ArrowRight size={18} />
            <span>Next Exercise</span>
          </button>
        )}
      </div>
    </div>
  )
}
