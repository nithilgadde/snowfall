import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSpaces } from '../contexts/SpacesContext'
import { streamChat, checkGroqStatus, getAvailableModels } from '../services/groq'
import ChatMessage from '../components/ChatMessage'
import ExercisePanel from '../components/ExercisePanel'
import SourcesPanel from '../components/SourcesPanel'
import FlashcardPanel from '../components/FlashcardPanel'
import QuizPanel from '../components/QuizPanel'
import SlideshowPanel from '../components/SlideshowPanel'
import { Send, Trash2, BookOpen, MessageSquare, Dumbbell, AlertCircle, Layers, FileQuestion, Presentation } from 'lucide-react'

export default function Space() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getSpaceById, getConversation, addMessage, clearConversation, getSources, getFlashcards } = useSpaces()
  const space = getSpaceById(id)
  const sources = getSources(id)
  const flashcards = getFlashcards(id)

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [aiStatus, setAiStatus] = useState({ available: false, models: [] })
  const [selectedModel, setSelectedModel] = useState('')

  const messagesContainerRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!space) {
      navigate('/')
      return
    }
    setMessages(getConversation(id))
    checkGroqStatus().then(status => {
      setAiStatus(status)
      if (status.models.length > 0) {
        const saved = localStorage.getItem('snowfall-model')
        // Default to Llama 3.3 70B on Groq
        setSelectedModel(saved || 'llama-3.3-70b-versatile')
      }
    })
  }, [id, space])

  useEffect(() => {
    // Scroll messages container to bottom
    if (messages.length > 0 && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  // Build sources context for the AI
  const buildSourcesContext = () => {
    if (!sources || sources.length === 0) return ''

    const sourceTexts = sources.map((source, i) => {
      let text = `\n--- Source ${i + 1}: ${source.title} ---`
      if (source.author) text += `\nAuthor: ${source.author}`
      if (source.url) text += `\nURL: ${source.url}`
      if (source.notes) text += `\nContent/Notes:\n${source.notes}`
      return text
    }).join('\n')

    return `\n\nLEARNING SOURCES PROVIDED BY THE STUDENT:
The student has added the following sources for you to use when teaching. Reference these materials when relevant and help them understand the content from these sources.
${sourceTexts}
\n--- End of Sources ---\n`
  }

  const systemPrompt = `You are Snowfall, an expert tutor helping students learn about ${space?.name}.
Your role is to:
- Explain concepts clearly and thoroughly
- Use examples and analogies to aid understanding
- Ask follow-up questions to check comprehension
- Encourage curiosity and deeper exploration
- Break down complex topics into manageable parts
- Provide practice problems when appropriate
- Use markdown formatting for clarity (headers, lists, code blocks)
- ALWAYS use LaTeX for ALL mathematical expressions, equations, and formulas:
  - Use $...$ for inline math (e.g., $x^2 + y^2 = z^2$)
  - Use $$...$$ for display/block math equations
  - Examples: $\\frac{a}{b}$, $\\sqrt{x}$, $\\int_0^1 f(x)dx$, $\\sum_{i=1}^n i$
${buildSourcesContext()}
Be patient, supportive, and adapt your explanations to the student's level.${sources.length > 0 ? ' When relevant, reference the learning sources the student has provided.' : ''}`

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !aiStatus.available) return

    const userMessage = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    addMessage(id, userMessage)
    setInput('')
    setIsLoading(true)

    try {
      let assistantContent = ''
      const assistantMessage = { role: 'assistant', content: '' }
      setMessages([...newMessages, assistantMessage])

      for await (const chunk of streamChat(selectedModel, newMessages, systemPrompt)) {
        assistantContent += chunk
        setMessages([...newMessages, { role: 'assistant', content: assistantContent }])
      }

      addMessage(id, { role: 'assistant', content: assistantContent })
    } catch (error) {
      console.error('Chat error:', error)
      setMessages([...newMessages, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please check your API key.`
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    if (confirm('Clear all messages in this space?')) {
      setMessages([])
      clearConversation(id)
      navigate('/')
    }
  }

  if (!space) return null

  return (
    <div className="space" style={{ '--accent': space.color }}>
      <header className="space-header">
        <div className="space-title">
          <h1>{space.name}</h1>
          <p>{space.description}</p>
        </div>

        <div className="space-actions">
          <button
            className="btn-icon"
            onClick={handleClear}
            title="Clear conversation"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <div className="space-tabs">
        <button
          className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={18} />
          <span>Chat</span>
        </button>
        <button
          className={`tab ${activeTab === 'exercises' ? 'active' : ''}`}
          onClick={() => setActiveTab('exercises')}
        >
          <Dumbbell size={18} />
          <span>Practice</span>
        </button>
        <button
          className={`tab ${activeTab === 'sources' ? 'active' : ''}`}
          onClick={() => setActiveTab('sources')}
        >
          <BookOpen size={18} />
          <span>Sources</span>
          {sources.length > 0 && <span className="tab-badge">{sources.length}</span>}
        </button>
        <button
          className={`tab ${activeTab === 'flashcards' ? 'active' : ''}`}
          onClick={() => setActiveTab('flashcards')}
        >
          <Layers size={18} />
          <span>Flashcards</span>
          {flashcards.length > 0 && <span className="tab-badge">{flashcards.length}</span>}
        </button>
        <button
          className={`tab ${activeTab === 'quiz' ? 'active' : ''}`}
          onClick={() => setActiveTab('quiz')}
        >
          <FileQuestion size={18} />
          <span>Quiz</span>
        </button>
        <button
          className={`tab ${activeTab === 'slides' ? 'active' : ''}`}
          onClick={() => setActiveTab('slides')}
        >
          <Presentation size={18} />
          <span>Slides</span>
        </button>
      </div>

      <div className="space-content">
        {!aiStatus.available && (
          <div className="ai-warning">
            <AlertCircle size={20} />
            <div>
              <strong>AI not connected</strong>
              <p>Set your GROQ_API_KEY environment variable and restart the dev server.</p>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="chat-container">
            <div className="messages" ref={messagesContainerRef}>
              {messages.length === 0 ? (
                <div className="empty-state">
                  <MessageSquare size={48} />
                  <h3>Start Learning</h3>
                  <p>Ask me anything about {space.name}. I'm here to help you understand and master this subject.</p>
                  {sources.length > 0 && (
                    <p className="sources-hint">You have {sources.length} source{sources.length > 1 ? 's' : ''} added. I'll use them to help teach you!</p>
                  )}
                  <div className="suggestions">
                    <button onClick={() => setInput(`What are the fundamentals of ${space.name}?`)}>
                      What are the fundamentals?
                    </button>
                    <button onClick={() => setInput(`Can you explain the key concepts in ${space.name}?`)}>
                      Explain key concepts
                    </button>
                    {sources.length > 0 && (
                      <button onClick={() => setInput(`Summarize the key points from my sources`)}>
                        Summarize my sources
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <ChatMessage key={i} message={msg} />
                ))
              )}
            </div>

            <form className="chat-input" onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={aiStatus.available ? "Ask a question..." : "AI not connected..."}
                disabled={!aiStatus.available || isLoading}
              />
              <button type="submit" disabled={!input.trim() || isLoading || !aiStatus.available}>
                <Send size={20} />
              </button>
            </form>
          </div>
        )}

        {activeTab === 'exercises' && (
          <ExercisePanel
            space={space}
            model={selectedModel}
            aiAvailable={aiStatus.available}
            conversation={messages}
          />
        )}

        {activeTab === 'sources' && (
          <SourcesPanel spaceId={id} />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardPanel
            space={space}
            model={selectedModel}
            aiAvailable={aiStatus.available}
            conversation={messages}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizPanel
            space={space}
            model={selectedModel}
            aiAvailable={aiStatus.available}
            conversation={messages}
          />
        )}

        {activeTab === 'slides' && (
          <SlideshowPanel
            space={space}
            model={selectedModel}
            aiAvailable={aiStatus.available}
            conversation={messages}
          />
        )}
      </div>
    </div>
  )
}
