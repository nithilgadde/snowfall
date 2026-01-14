import { useState } from 'react'
import { generateSlideshow, fetchSlideshowImages } from '../services/groq'
import { useSpaces } from '../contexts/SpacesContext'
import { useTheme } from '../contexts/ThemeContext'
import pptxgen from 'pptxgenjs'
import { jsPDF } from 'jspdf'
import {
  Presentation, Loader, AlertCircle, FileText,
  File, ChevronLeft, ChevronRight, RotateCcw, Sparkles, Image
} from 'lucide-react'

export default function SlideshowPanel({ space, model, aiAvailable, conversation }) {
  const { getSources, getFlashcards } = useSpaces()
  const { theme } = useTheme()
  const sources = getSources(space.id)
  const flashcards = getFlashcards(space.id)

  const [state, setState] = useState('setup') // setup, loading, loadingImages, preview
  const [slideCount, setSlideCount] = useState(5)
  const [topic, setTopic] = useState('')
  const [includeImages, setIncludeImages] = useState(false)
  const [slideshow, setSlideshow] = useState(null)
  const [images, setImages] = useState({})
  const [currentSlide, setCurrentSlide] = useState(0)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)

  const hasContent = conversation.length > 0 || sources.length > 0 || flashcards.length > 0
  const isLightTheme = theme === 'light'

  const handleGenerate = async () => {
    if (!aiAvailable) return
    setState('loading')
    setError(null)
    setCurrentSlide(0)
    setImages({})

    try {
      const generated = await generateSlideshow(model, space.name, slideCount, topic, {
        conversation,
        sources,
        flashcards
      }, includeImages)

      setSlideshow(generated)

      // Fetch images if enabled
      if (includeImages && generated.slides) {
        setState('loadingImages')
        const fetchedImages = await fetchSlideshowImages(generated.slides)
        setImages(fetchedImages)
      }

      setState('preview')
    } catch (err) {
      setError(err.message)
      setState('setup')
    }
  }

  const handleReset = () => {
    setState('setup')
    setSlideshow(null)
    setImages({})
    setCurrentSlide(0)
    setError(null)
  }

  const downloadPowerPoint = async () => {
    if (!slideshow) return
    setDownloading(true)

    try {
      const pptx = new pptxgen()
      pptx.title = slideshow.title
      pptx.subject = slideshow.subtitle
      pptx.author = 'Snowfall'

      // Define colors based on theme
      const bgColor = isLightTheme ? 'FFFFFF' : '1a1a2e'
      const textColor = isLightTheme ? '1a1a2e' : 'FFFFFF'
      const accentColor = '6366f1'

      for (let index = 0; index < slideshow.slides.length; index++) {
        const slide = slideshow.slides[index]
        const pptSlide = pptx.addSlide()
        pptSlide.background = { color: bgColor }

        const hasImage = images[index]?.url

        if (index === 0) {
          // Title slide
          pptSlide.addText(slideshow.title, {
            x: 0.5,
            y: hasImage ? 0.5 : 2,
            w: 9,
            h: 1.5,
            fontSize: 44,
            bold: true,
            color: textColor,
            align: 'center'
          })
          pptSlide.addText(slideshow.subtitle, {
            x: 0.5,
            y: hasImage ? 2 : 3.5,
            w: 9,
            h: 0.75,
            fontSize: 24,
            color: accentColor,
            align: 'center'
          })

          // Add image to title slide if available
          if (hasImage) {
            try {
              pptSlide.addImage({
                path: images[index].url,
                x: 2.5,
                y: 3,
                w: 5,
                h: 2.5
              })
            } catch (imgErr) {
              console.error('Failed to add image:', imgErr)
            }
          }
        } else {
          // Content slides with optional image
          const contentWidth = hasImage ? 5.5 : 9

          pptSlide.addText(slide.title, {
            x: 0.5,
            y: 0.5,
            w: contentWidth,
            h: 0.75,
            fontSize: 28,
            bold: true,
            color: textColor
          })

          // Add content text (paragraphs)
          pptSlide.addText(slide.content || '', {
            x: 0.5,
            y: 1.4,
            w: contentWidth,
            h: 4.2,
            fontSize: 14,
            color: textColor,
            valign: 'top',
            paraSpaceAfter: 10
          })

          // Add image on the right side if available
          if (hasImage) {
            try {
              pptSlide.addImage({
                path: images[index].url,
                x: 6.2,
                y: 1.5,
                w: 3.5,
                h: 3.5
              })
            } catch (imgErr) {
              console.error('Failed to add image:', imgErr)
            }
          }
        }
      }

      await pptx.writeFile({ fileName: `${slideshow.title.replace(/[^a-z0-9]/gi, '_')}.pptx` })
    } catch (err) {
      setError('Failed to generate PowerPoint: ' + err.message)
    }

    setDownloading(false)
  }

  const downloadPDF = async () => {
    if (!slideshow) return
    setDownloading(true)

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // Colors based on theme
      const bgColor = isLightTheme ? [255, 255, 255] : [26, 26, 46]
      const textColor = isLightTheme ? [26, 26, 46] : [255, 255, 255]
      const accentColor = [99, 102, 241]

      // Pre-load images as base64
      const imageDataPromises = Object.entries(images).map(async ([index, img]) => {
        try {
          const response = await fetch(img.url)
          const blob = await response.blob()
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve({ index: parseInt(index), data: reader.result })
            reader.onerror = () => resolve({ index: parseInt(index), data: null })
            reader.readAsDataURL(blob)
          })
        } catch {
          return { index: parseInt(index), data: null }
        }
      })

      const imageDataResults = await Promise.all(imageDataPromises)
      const imageData = {}
      imageDataResults.forEach(({ index, data }) => {
        if (data) imageData[index] = data
      })

      slideshow.slides.forEach((slide, index) => {
        if (index > 0) pdf.addPage()

        // Background
        pdf.setFillColor(...bgColor)
        pdf.rect(0, 0, pageWidth, pageHeight, 'F')

        const hasImage = imageData[index]
        const contentWidth = hasImage ? pageWidth * 0.55 : pageWidth - 40

        if (index === 0) {
          // Title slide
          pdf.setTextColor(...textColor)
          pdf.setFontSize(36)
          pdf.setFont('helvetica', 'bold')
          const titleLines = pdf.splitTextToSize(slideshow.title, pageWidth - 40)
          pdf.text(titleLines, pageWidth / 2, hasImage ? 30 : pageHeight / 2 - 10, { align: 'center' })

          pdf.setTextColor(...accentColor)
          pdf.setFontSize(18)
          pdf.setFont('helvetica', 'normal')
          pdf.text(slideshow.subtitle, pageWidth / 2, hasImage ? 45 : pageHeight / 2 + 15, { align: 'center' })

          // Add image to title slide
          if (hasImage) {
            try {
              pdf.addImage(imageData[index], 'JPEG', pageWidth / 2 - 50, 55, 100, 75)
            } catch (imgErr) {
              console.error('Failed to add image to PDF:', imgErr)
            }
          }
        } else {
          // Content slides
          pdf.setTextColor(...textColor)
          pdf.setFontSize(22)
          pdf.setFont('helvetica', 'bold')
          const titleLines = pdf.splitTextToSize(slide.title, contentWidth)
          pdf.text(titleLines, 20, 25)

          // Calculate where content starts based on title height
          const titleHeight = titleLines.length * 10
          let yPos = 25 + titleHeight + 10

          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'normal')

          // Split content into paragraphs and render
          const content = slide.content || ''
          const paragraphs = content.split('\n\n')

          paragraphs.forEach(paragraph => {
            const lines = pdf.splitTextToSize(paragraph.trim(), contentWidth)
            lines.forEach(line => {
              if (yPos > pageHeight - 20) return
              pdf.text(line, 20, yPos)
              yPos += 6
            })
            yPos += 6 // Space between paragraphs
          })

          // Add image on the right side
          if (hasImage) {
            try {
              pdf.addImage(imageData[index], 'JPEG', pageWidth - 100, 35, 80, 60)
            } catch (imgErr) {
              console.error('Failed to add image to PDF:', imgErr)
            }
          }
        }

        // Page number
        pdf.setFontSize(10)
        pdf.setTextColor(150, 150, 150)
        pdf.text(`${index + 1} / ${slideshow.slides.length}`, pageWidth - 20, pageHeight - 10)
      })

      pdf.save(`${slideshow.title.replace(/[^a-z0-9]/gi, '_')}.pdf`)
    } catch (err) {
      setError('Failed to generate PDF: ' + err.message)
    }

    setDownloading(false)
  }

  const downloadGoogleSlides = async () => {
    // Generate PowerPoint which can be uploaded to Google Slides
    await downloadPowerPoint()
    // Show a helpful message
    alert('PowerPoint file downloaded! To use in Google Slides:\n\n1. Go to slides.google.com\n2. Click "Blank" to create a new presentation\n3. Go to File > Import slides\n4. Upload the downloaded .pptx file')
  }

  if (!aiAvailable) {
    return (
      <div className="slideshow-panel">
        <div className="ai-warning">
          <AlertCircle size={20} />
          <div>
            <strong>AI required for slideshows</strong>
            <p>Set your GROQ_API_KEY to generate slideshows.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!hasContent) {
    return (
      <div className="slideshow-panel">
        <div className="empty-state">
          <Presentation size={48} />
          <h3>Add Learning Materials First</h3>
          <p>Chat with Snowfall, add sources, or create flashcards to generate a slideshow.</p>
        </div>
      </div>
    )
  }

  // Setup Screen
  if (state === 'setup') {
    return (
      <div className="slideshow-panel">
        <div className="slideshow-setup">
          <div className="slideshow-setup-header">
            <Presentation size={48} />
            <h2>Create a Slideshow</h2>
            <p>Generate a professional presentation based on your learning materials.</p>
          </div>

          <div className="slideshow-setup-stats">
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
            <div className="slideshow-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="slideshow-options">
            <div className="option-group">
              <label htmlFor="topic">Topic (optional):</label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={`e.g., "Introduction to ${space.name}"`}
                className="topic-input"
              />
            </div>

            <div className="option-group">
              <label>Number of slides:</label>
              <div className="slide-count-selector">
                {[5, 8, 10, 15].map(count => (
                  <button
                    key={count}
                    className={`count-option ${slideCount === count ? 'active' : ''}`}
                    onClick={() => setSlideCount(count)}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="option-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                />
                <Image size={18} />
                <span>Include open-source images</span>
              </label>
              <p className="option-hint">Automatically add relevant images from Pexels to your slides</p>
            </div>
          </div>

          <button className="btn-primary slideshow-generate-btn" onClick={handleGenerate}>
            <Sparkles size={20} />
            Generate Slideshow
          </button>
        </div>
      </div>
    )
  }

  // Loading Screen
  if (state === 'loading') {
    return (
      <div className="slideshow-panel">
        <div className="empty-state">
          <Loader size={48} className="spin" />
          <h3>Creating Your Slideshow</h3>
          <p>Generating {slideCount} slides about {topic || space.name}...</p>
        </div>
      </div>
    )
  }

  // Loading Images Screen
  if (state === 'loadingImages') {
    return (
      <div className="slideshow-panel">
        <div className="empty-state">
          <Loader size={48} className="spin" />
          <h3>Fetching Images</h3>
          <p>Finding relevant open-source images for your slides...</p>
        </div>
      </div>
    )
  }

  // Preview Screen
  const slide = slideshow?.slides[currentSlide]
  const isFirstSlide = currentSlide === 0
  const currentImage = images[currentSlide]

  return (
    <div className="slideshow-panel">
      <div className="slideshow-preview">
        <div className="preview-header">
          <button className="btn-secondary" onClick={handleReset}>
            <RotateCcw size={18} />
            New Slideshow
          </button>
          <div className="preview-title">
            <h3>{slideshow.title}</h3>
          </div>
          <div className="download-buttons">
            <button
              className="btn-download pdf"
              onClick={downloadPDF}
              disabled={downloading}
              title="Download as PDF"
            >
              <FileText size={18} />
              PDF
            </button>
            <button
              className="btn-download pptx"
              onClick={downloadPowerPoint}
              disabled={downloading}
              title="Download as PowerPoint"
            >
              <File size={18} />
              PPTX
            </button>
            <button
              className="btn-download google"
              onClick={downloadGoogleSlides}
              disabled={downloading}
              title="Download for Google Slides"
            >
              <Presentation size={18} />
              Google
            </button>
          </div>
        </div>

        <div className={`slide-preview ${isLightTheme ? 'light' : 'dark'} ${currentImage ? 'has-image' : ''}`}>
          {isFirstSlide ? (
            <div className="slide-content title-slide">
              <h1>{slideshow.title}</h1>
              <p className="subtitle">{slideshow.subtitle}</p>
              {currentImage && (
                <div className="slide-image title-image">
                  <img src={currentImage.url} alt={currentImage.alt} />
                  <span className="image-credit">Photo by {currentImage.photographer}</span>
                </div>
              )}
            </div>
          ) : (
            <div className={`slide-content ${currentImage ? 'with-image' : ''}`}>
              <div className="slide-text">
                <h2>{slide.title}</h2>
                <div className="slide-paragraphs">
                  {(slide.content || '').split('\n\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>
              {currentImage && (
                <div className="slide-image">
                  <img src={currentImage.url} alt={currentImage.alt} />
                  <span className="image-credit">Photo by {currentImage.photographer}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="slide-navigation">
          <button
            className="nav-btn"
            onClick={() => setCurrentSlide(prev => prev - 1)}
            disabled={currentSlide === 0}
          >
            <ChevronLeft size={24} />
          </button>
          <span className="slide-counter">
            {currentSlide + 1} / {slideshow.slides.length}
          </span>
          <button
            className="nav-btn"
            onClick={() => setCurrentSlide(prev => prev + 1)}
            disabled={currentSlide === slideshow.slides.length - 1}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  )
}
