import { Link } from 'react-router-dom'
import { Snowflake, ArrowRight, BookOpen, MessageSquare, Dumbbell, Sparkles, Zap, Layers } from 'lucide-react'

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-ambient">
        <div className="ambient-glow ambient-glow-1" />
        <div className="ambient-glow ambient-glow-2" />
      </div>

      <nav className="landing-nav">
        <Link to="/" className="landing-logo">
          <div className="landing-logo-icon">
            <Snowflake size={24} />
          </div>
          <span>Snowfall</span>
        </Link>

        <div className="landing-nav-links">
          <Link to="/signin" className="landing-nav-link">Sign in</Link>
          <Link to="/signup" className="landing-nav-cta">
            Get started
            <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="hero-badge">
            <Zap size={14} />
            <span>Lightning-Fast AI</span>
          </div>

          <h1 className="hero-title">
            Learn faster with
            <br />
            <span className="hero-gradient">instant AI responses</span>
          </h1>

          <p className="hero-description">
            Get answers in milliseconds, generate flashcards instantly, and master any subject
            with an AI tutor powered by the fastest language models available.
          </p>

          <div className="hero-actions">
            <Link to="/signup" className="hero-cta-primary">
              Start learning free
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="hero-visual">
            <div className="visual-window">
              <div className="window-header">
                <div className="window-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="window-title">Mathematics</span>
              </div>
              <div className="window-content">
                <div className="chat-preview">
                  <div className="preview-message preview-user">
                    <span>Can you explain the unit circle?</span>
                  </div>
                  <div className="preview-message preview-ai">
                    <div className="preview-avatar">
                      <Snowflake size={14} />
                    </div>
                    <div className="preview-text">
                      <span>The unit circle is a circle with radius 1 centered at the origin. It's fundamental for understanding trigonometry...</span>
                      <div className="preview-typing">
                        <span /><span /><span />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="visual-cards">
              <div className="floating-card card-sources">
                <Zap size={18} />
                <span>~200ms responses</span>
              </div>
              <div className="floating-card card-exercises">
                <Layers size={18} />
                <span>Flashcards</span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-features">
          <div className="features-header">
            <h2>Everything you need to learn effectively</h2>
            <p>Lightning-fast AI tutoring with smart study tools</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <Zap size={24} />
              </div>
              <h3>Blazing Fast AI</h3>
              <p>Powered by Groq's lightning-fast inference. Get detailed explanations and answers in milliseconds, not seconds.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                <Layers size={24} />
              </div>
              <h3>Smart Flashcards</h3>
              <p>Generate flashcards instantly from your conversations and sources. Track your progress and master any topic.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
                <BookOpen size={24} />
              </div>
              <h3>Add Your Sources</h3>
              <p>Upload articles, notes, and videos. Your AI tutor learns from your materials to give personalized answers.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>
                <Dumbbell size={24} />
              </div>
              <h3>Practice Exercises</h3>
              <p>Generate practice problems based on what you're learning. Test your knowledge with instant feedback.</p>
            </div>
          </div>
        </section>

        <section className="landing-cta">
          <div className="cta-content">
            <Snowflake size={40} className="cta-icon" />
            <h2>Ready to learn at the speed of thought?</h2>
            <p>Experience the fastest AI tutor with instant flashcard generation</p>
            <Link to="/signup" className="cta-button">
              Create free account
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Snowflake size={20} />
            <span>Snowfall</span>
          </div>
          <p>AI-powered learning for everyone</p>
        </div>
      </footer>
    </div>
  )
}
