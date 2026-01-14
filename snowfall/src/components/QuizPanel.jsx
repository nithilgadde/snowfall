import { useState } from 'react'
import { generateQuiz, evaluateShortAnswer } from '../services/groq'
import { useSpaces } from '../contexts/SpacesContext'
import {
  FileQuestion, Loader, AlertCircle, CheckCircle, XCircle,
  ChevronRight, RotateCcw, Trophy, Target, Clock
} from 'lucide-react'

export default function QuizPanel({ space, model, aiAvailable, conversation }) {
  const { getSources, getFlashcards, getWrongAnswers, addWrongAnswer } = useSpaces()
  const sources = getSources(space.id)
  const flashcards = getFlashcards(space.id)
  const wrongAnswers = getWrongAnswers ? getWrongAnswers(space.id) : []

  const [quizState, setQuizState] = useState('setup') // setup, loading, active, results
  const [questionCount, setQuestionCount] = useState(5)
  const [quiz, setQuiz] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showExplanation, setShowExplanation] = useState(false)
  const [error, setError] = useState(null)
  const [evaluating, setEvaluating] = useState(false)

  const hasContent = conversation.length > 0 || sources.length > 0 || flashcards.length > 0

  const handleGenerateQuiz = async () => {
    if (!aiAvailable) return
    setQuizState('loading')
    setError(null)
    setAnswers({})
    setCurrentQuestion(0)
    setShowExplanation(false)

    try {
      const generatedQuiz = await generateQuiz(model, space.name, questionCount, {
        conversation,
        sources,
        flashcards,
        wrongAnswers
      })
      setQuiz(generatedQuiz)
      setQuizState('active')
    } catch (err) {
      setError(err.message)
      setQuizState('setup')
    }
  }

  const handleAnswer = async (answer) => {
    const question = quiz.questions[currentQuestion]
    let isCorrect
    let aiFeedback = null

    // Use AI evaluation for short answer questions
    if (question.type === 'short_answer') {
      setEvaluating(true)
      try {
        const evaluation = await evaluateShortAnswer(
          model,
          question.question,
          question.answer,
          answer
        )
        isCorrect = evaluation.isCorrect
        aiFeedback = evaluation.feedback
      } catch (err) {
        // Fallback to exact match if AI fails
        isCorrect = answer.toLowerCase().trim() === question.answer.toLowerCase().trim()
        aiFeedback = "Could not use AI evaluation"
      }
      setEvaluating(false)
    } else {
      // Exact match for multiple choice and true/false
      isCorrect = answer.toLowerCase() === question.answer.toLowerCase()
    }

    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: { answer, isCorrect, aiFeedback }
    }))

    // Track wrong answers for future quizzes
    if (!isCorrect && addWrongAnswer) {
      addWrongAnswer(space.id, {
        question: question.question,
        answer: question.answer,
        userAnswer: answer,
        topic: question.topic
      })
    }

    setShowExplanation(true)
  }

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
      setShowExplanation(false)
    } else {
      setQuizState('results')
    }
  }

  const handleRestart = () => {
    setQuizState('setup')
    setQuiz(null)
    setAnswers({})
    setCurrentQuestion(0)
    setShowExplanation(false)
  }

  const getScore = () => {
    const correct = Object.values(answers).filter(a => a.isCorrect).length
    return { correct, total: quiz?.questions.length || 0 }
  }

  if (!aiAvailable) {
    return (
      <div className="quiz-panel">
        <div className="ai-warning">
          <AlertCircle size={20} />
          <div>
            <strong>AI required for quizzes</strong>
            <p>Set your GROQ_API_KEY to generate quizzes.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!hasContent) {
    return (
      <div className="quiz-panel">
        <div className="empty-state">
          <FileQuestion size={48} />
          <h3>Add Learning Materials First</h3>
          <p>Chat with Snowfall, add sources, or create flashcards to generate a personalized quiz.</p>
        </div>
      </div>
    )
  }

  // Setup Screen
  if (quizState === 'setup') {
    return (
      <div className="quiz-panel">
        <div className="quiz-setup">
          <div className="quiz-setup-header">
            <FileQuestion size={48} />
            <h2>Create a Quiz</h2>
            <p>Test your knowledge with a personalized quiz based on your learning materials.</p>
          </div>

          <div className="quiz-setup-stats">
            <div className="setup-stat">
              <span className="stat-value">{conversation.length}</span>
              <span className="stat-label">Chat messages</span>
            </div>
            <div className="setup-stat">
              <span className="stat-value">{sources.length}</span>
              <span className="stat-label">Sources</span>
            </div>
            <div className="setup-stat">
              <span className="stat-value">{flashcards.length}</span>
              <span className="stat-label">Flashcards</span>
            </div>
          </div>

          {error && (
            <div className="quiz-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="quiz-setup-options">
            <label htmlFor="questionCount">Number of questions:</label>
            <div className="question-count-selector">
              {[5, 10, 15, 20].map(count => (
                <button
                  key={count}
                  className={`count-option ${questionCount === count ? 'active' : ''}`}
                  onClick={() => setQuestionCount(count)}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary quiz-start-btn" onClick={handleGenerateQuiz}>
            <FileQuestion size={20} />
            Generate Quiz
          </button>
        </div>
      </div>
    )
  }

  // Loading Screen
  if (quizState === 'loading') {
    return (
      <div className="quiz-panel">
        <div className="empty-state">
          <Loader size={48} className="spin" />
          <h3>Creating Your Quiz</h3>
          <p>Analyzing your learning materials and generating {questionCount} questions...</p>
        </div>
      </div>
    )
  }

  // Results Screen
  if (quizState === 'results') {
    const { correct, total } = getScore()
    const percentage = Math.round((correct / total) * 100)

    return (
      <div className="quiz-panel">
        <div className="quiz-results">
          <div className="results-header">
            <Trophy size={64} className={percentage >= 70 ? 'trophy-gold' : 'trophy-silver'} />
            <h2>Quiz Complete!</h2>
            <p className="results-title">{quiz.title}</p>
          </div>

          <div className="results-score">
            <div className="score-circle" style={{ '--percentage': percentage }}>
              <span className="score-value">{percentage}%</span>
            </div>
            <p className="score-text">{correct} out of {total} correct</p>
          </div>

          <div className="results-breakdown">
            {quiz.questions.map((q, i) => (
              <div key={i} className={`result-item ${answers[i]?.isCorrect ? 'correct' : 'incorrect'}`}>
                <span className="result-icon">
                  {answers[i]?.isCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />}
                </span>
                <span className="result-question">Q{i + 1}: {q.topic}</span>
              </div>
            ))}
          </div>

          <div className="results-actions">
            <button className="btn-secondary" onClick={handleRestart}>
              <RotateCcw size={18} />
              New Quiz
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Active Quiz Screen
  const question = quiz.questions[currentQuestion]
  const answered = answers[currentQuestion] !== undefined

  return (
    <div className="quiz-panel">
      <div className="quiz-active">
        <div className="quiz-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
          <span className="progress-text">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </span>
        </div>

        <div className="quiz-question-card">
          <div className="question-header">
            <span className={`difficulty-badge ${question.difficulty}`}>
              {question.difficulty}
            </span>
            <span className="topic-badge">{question.topic}</span>
          </div>

          <h3 className="question-text">{question.question}</h3>

          <div className="question-options">
            {question.type === 'multiple_choice' && question.options.map((option, i) => (
              <button
                key={i}
                className={`quiz-option ${
                  answered
                    ? option === question.answer
                      ? 'correct'
                      : answers[currentQuestion]?.answer === option
                        ? 'incorrect'
                        : ''
                    : ''
                }`}
                onClick={() => !answered && handleAnswer(option)}
                disabled={answered}
              >
                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                <span className="option-text">{option}</span>
                {answered && option === question.answer && <CheckCircle size={18} />}
                {answered && answers[currentQuestion]?.answer === option && option !== question.answer && <XCircle size={18} />}
              </button>
            ))}

            {question.type === 'true_false' && ['True', 'False'].map((option) => (
              <button
                key={option}
                className={`quiz-option ${
                  answered
                    ? option === question.answer
                      ? 'correct'
                      : answers[currentQuestion]?.answer === option
                        ? 'incorrect'
                        : ''
                    : ''
                }`}
                onClick={() => !answered && handleAnswer(option)}
                disabled={answered}
              >
                <span className="option-text">{option}</span>
                {answered && option === question.answer && <CheckCircle size={18} />}
                {answered && answers[currentQuestion]?.answer === option && option !== question.answer && <XCircle size={18} />}
              </button>
            ))}

            {question.type === 'short_answer' && !answered && !evaluating && (
              <ShortAnswerInput onSubmit={handleAnswer} />
            )}

            {question.type === 'short_answer' && evaluating && (
              <div className="short-answer-evaluating">
                <Loader size={20} className="spin" />
                <span>AI is evaluating your answer...</span>
              </div>
            )}

            {question.type === 'short_answer' && answered && (
              <div className={`short-answer-result ${answers[currentQuestion]?.isCorrect ? 'correct' : 'incorrect'}`}>
                <p><strong>Your answer:</strong> {answers[currentQuestion]?.answer}</p>
                <p><strong>Expected:</strong> {question.answer}</p>
                {answers[currentQuestion]?.aiFeedback && (
                  <p className="ai-feedback"><strong>AI Feedback:</strong> {answers[currentQuestion].aiFeedback}</p>
                )}
              </div>
            )}
          </div>

          {showExplanation && (
            <div className={`explanation ${answers[currentQuestion]?.isCorrect ? 'correct' : 'incorrect'}`}>
              <div className="explanation-header">
                {answers[currentQuestion]?.isCorrect ? (
                  <><CheckCircle size={20} /> Correct!</>
                ) : (
                  <><XCircle size={20} /> Incorrect</>
                )}
              </div>
              <p>{question.explanation}</p>
            </div>
          )}
        </div>

        {answered && (
          <button className="btn-primary quiz-next-btn" onClick={handleNext}>
            {currentQuestion < quiz.questions.length - 1 ? (
              <>Next Question <ChevronRight size={18} /></>
            ) : (
              <>See Results <Trophy size={18} /></>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function ShortAnswerInput({ onSubmit }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (value.trim()) {
      onSubmit(value.trim())
    }
  }

  return (
    <form className="short-answer-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type your answer..."
        autoFocus
      />
      <button type="submit" className="btn-primary" disabled={!value.trim()}>
        Submit
      </button>
    </form>
  )
}
