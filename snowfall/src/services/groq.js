const GROQ_BASE_URL = '/api/groq'
const IMAGES_API_URL = '/api/images'

// Default model - Llama 3.3 70B is fast and capable
const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

// Clean up image query to improve search results
function sanitizeImageQuery(query) {
  // Remove abstract/generic words that return poor results
  const badWords = ['introduction', 'overview', 'summary', 'conclusion', 'basics',
    'concept', 'concepts', 'understanding', 'learning', 'chapter', 'section',
    'key points', 'main ideas', 'review', 'the', 'a', 'an', 'of', 'and', 'to']

  let cleaned = query.toLowerCase()
  badWords.forEach(word => {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'gi'), '')
  })

  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  // If query is too short after cleaning, use original
  if (cleaned.length < 3) {
    return query.trim()
  }

  return cleaned
}

// Fetch image from Pexels/placeholder API
export async function fetchImage(query) {
  try {
    // Clean up the query for better results
    const cleanedQuery = sanitizeImageQuery(query)

    // Request multiple images to get better options
    const response = await fetch(`${IMAGES_API_URL}/search?query=${encodeURIComponent(cleanedQuery)}&per_page=5`)
    if (!response.ok) {
      throw new Error('Failed to fetch image')
    }
    const data = await response.json()
    if (data.photos && data.photos.length > 0) {
      // Pick the first image (Pexels sorts by relevance)
      const photo = data.photos[0]
      return {
        url: photo.src.large || photo.src.medium,
        alt: photo.alt || query,
        photographer: photo.photographer
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching image:', error)
    // Return placeholder with original query for seeding
    return {
      url: `https://picsum.photos/seed/${encodeURIComponent(query)}/800/600`,
      alt: query,
      photographer: 'Lorem Picsum'
    }
  }
}

// Fetch images for all slides
export async function fetchSlideshowImages(slides) {
  const imagePromises = slides.map(async (slide, index) => {
    if (slide.imageQuery) {
      const image = await fetchImage(slide.imageQuery)
      return { index, image }
    }
    return { index, image: null }
  })

  const results = await Promise.all(imagePromises)
  const images = {}
  results.forEach(({ index, image }) => {
    if (image) {
      images[index] = image
    }
  })
  return images
}

export async function checkGroqStatus() {
  try {
    const response = await fetch(`${GROQ_BASE_URL}/models`)
    if (response.ok) {
      const data = await response.json()
      return { available: true, models: data.data || [] }
    }
    return { available: false, models: [] }
  } catch {
    return { available: false, models: [] }
  }
}

export async function getAvailableModels() {
  try {
    const response = await fetch(`${GROQ_BASE_URL}/models`)
    if (response.ok) {
      const data = await response.json()
      // Map to similar format as Ollama
      return (data.data || []).map(m => ({
        name: m.id,
        displayName: m.id
      }))
    }
    return []
  } catch {
    return []
  }
}

export async function* streamChat(model, messages, systemPrompt) {
  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      stream: true
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Groq error: ${response.statusText} - ${error}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8', { fatal: false })
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    // Append new chunk to buffer, using stream mode for proper UTF-8 handling
    buffer += decoder.decode(value, { stream: true })

    // Process complete lines only
    const lines = buffer.split('\n')
    // Keep the last potentially incomplete line in the buffer
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue

      if (trimmedLine.startsWith('data: ')) {
        const data = trimmedLine.slice(6)
        if (data === '[DONE]') continue
        try {
          const json = JSON.parse(data)
          const content = json.choices?.[0]?.delta?.content
          if (content) {
            yield content
          }
        } catch {
          // Skip malformed JSON - might be incomplete, will be handled in next chunk
        }
      }
    }
  }

  // Process any remaining data in buffer
  if (buffer.trim()) {
    const trimmedLine = buffer.trim()
    if (trimmedLine.startsWith('data: ')) {
      const data = trimmedLine.slice(6)
      if (data !== '[DONE]') {
        try {
          const json = JSON.parse(data)
          const content = json.choices?.[0]?.delta?.content
          if (content) {
            yield content
          }
        } catch {
          // Final chunk was incomplete, nothing we can do
        }
      }
    }
  }
}

export async function generateExercise(model, spaceName, difficulty = 'medium', conversation = [], previousQuestions = []) {
  // Build context from conversation
  const recentMessages = conversation.slice(-10) // Last 10 messages for context
  const conversationContext = recentMessages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n')

  // Build list of previous questions to avoid
  const previousQuestionsText = previousQuestions.length > 0
    ? `\n\nPREVIOUSLY ASKED QUESTIONS (DO NOT repeat these or ask similar ones):\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : ''

  const questionTypes = ['multiple_choice', 'short_answer', 'true_false']
  const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)]

  const systemPrompt = `You are a creative educational content creator. Analyze the learning conversation below and generate a UNIQUE and CREATIVE practice exercise.

CONVERSATION CONTEXT:
${conversationContext || `The student is learning about ${spaceName}.`}
${previousQuestionsText}

IMPORTANT INSTRUCTIONS:
- Create a ${difficulty} difficulty exercise that is COMPLETELY DIFFERENT from any previous questions
- Be creative! Use different angles, scenarios, and question formats
- Vary the type of thinking required (recall, application, analysis, problem-solving)
- Suggested question type for variety: ${randomType} (but you can choose another if more appropriate)
- If the conversation covers multiple topics, pick a DIFFERENT aspect each time
- Make the question engaging and thought-provoking

Return ONLY valid JSON in this exact format:
{
  "topic": "The specific topic this exercise is about",
  "question": "The question text - make it unique and engaging",
  "type": "multiple_choice" | "short_answer" | "true_false",
  "options": ["A", "B", "C", "D"] (only for multiple_choice),
  "answer": "The correct answer",
  "explanation": "Why this is correct",
  "hint": "A helpful hint"
}`

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a fresh, unique ${difficulty} practice exercise. Be creative and avoid any repetition!` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to generate exercise: ${response.statusText}`)
  }

  const data = await response.json()
  try {
    return JSON.parse(data.choices[0].message.content)
  } catch {
    throw new Error('Invalid exercise format received')
  }
}

export async function generateFlashcards(model, spaceName, count = 5, conversation = [], sources = []) {
  // Build context from conversation
  const recentMessages = conversation.slice(-20)
  const conversationContext = recentMessages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n')

  // Build context from sources
  const sourcesContext = sources
    .map((s, i) => {
      let text = `Source ${i + 1}: ${s.title}`
      if (s.author) text += ` by ${s.author}`
      if (s.notes) text += `\nContent: ${s.notes}`
      return text
    })
    .join('\n\n')

  const systemPrompt = `You are an educational flashcard creator. Based on the learning materials and conversation provided, create ${count} flashcards to help the student memorize and understand key concepts.

${conversationContext ? `CONVERSATION CONTEXT:\n${conversationContext}\n` : ''}
${sourcesContext ? `LEARNING SOURCES:\n${sourcesContext}\n` : ''}
${!conversationContext && !sourcesContext ? `The student is learning about ${spaceName}.` : ''}

Create exactly ${count} flashcards covering the most important concepts. Each flashcard should have:
- A clear, focused question on the front
- A concise but complete answer on the back
- Questions should test understanding, not just memorization

Return ONLY valid JSON in this exact format:
{
  "flashcards": [
    {
      "front": "The question or term",
      "back": "The answer or definition",
      "topic": "Brief topic label"
    }
  ]
}`

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate ${count} flashcards based on the learning materials provided.` }
      ],
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to generate flashcards: ${response.statusText}`)
  }

  const data = await response.json()
  try {
    const result = JSON.parse(data.choices[0].message.content)
    return result.flashcards || []
  } catch {
    throw new Error('Invalid flashcard format received')
  }
}

export async function evaluateShortAnswer(model, question, correctAnswer, userAnswer) {
  const systemPrompt = `You are an educational answer evaluator. Your job is to determine if a student's answer is correct or close enough to be considered correct.

EVALUATION CRITERIA:
- The answer doesn't need to be word-for-word identical
- Accept answers that convey the same meaning or key concepts
- Accept reasonable synonyms and paraphrasing
- Accept answers that contain the correct information even if they include extra details
- Be lenient with spelling mistakes if the meaning is clear
- For numerical answers, accept equivalent forms (e.g., "50%" = "0.5" = "half")

Return ONLY valid JSON in this exact format:
{
  "isCorrect": true or false,
  "feedback": "Brief explanation of why the answer is correct or what was missing"
}`

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Question: ${question}\n\nExpected Answer: ${correctAnswer}\n\nStudent's Answer: ${userAnswer}\n\nIs the student's answer correct or close enough to be considered correct?` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to evaluate answer: ${response.statusText}`)
  }

  const data = await response.json()
  try {
    return JSON.parse(data.choices[0].message.content)
  } catch {
    // If parsing fails, default to strict comparison
    return {
      isCorrect: userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim(),
      feedback: "Could not evaluate - used exact match"
    }
  }
}

export async function generateQuiz(model, spaceName, questionCount = 10, context = {}) {
  const { conversation = [], sources = [], flashcards = [], wrongAnswers = [] } = context

  // Build context from conversation
  const recentMessages = conversation.slice(-20)
  const conversationContext = recentMessages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n')

  // Build context from sources
  const sourcesContext = sources
    .map((s, i) => {
      let text = `Source ${i + 1}: ${s.title}`
      if (s.author) text += ` by ${s.author}`
      if (s.notes) text += `\nContent: ${s.notes}`
      return text
    })
    .join('\n\n')

  // Build context from flashcards
  const flashcardsContext = flashcards
    .map((f, i) => `Flashcard ${i + 1}: Q: ${f.front} A: ${f.back}`)
    .join('\n')

  // Build context from wrong answers (areas to focus on)
  const wrongAnswersContext = wrongAnswers.length > 0
    ? `\n\nAREAS THE STUDENT STRUGGLED WITH (prioritize these topics):\n${wrongAnswers.map((w, i) => `${i + 1}. Question: ${w.question} - Correct answer: ${w.answer}`).join('\n')}`
    : ''

  const systemPrompt = `You are an educational quiz creator. Create a comprehensive quiz based on ALL the learning materials provided.

LEARNING CONTEXT:
${conversationContext ? `\n--- CHAT HISTORY ---\n${conversationContext}\n` : ''}
${sourcesContext ? `\n--- SOURCES ---\n${sourcesContext}\n` : ''}
${flashcardsContext ? `\n--- FLASHCARDS ---\n${flashcardsContext}\n` : ''}
${wrongAnswersContext}
${!conversationContext && !sourcesContext && !flashcardsContext ? `The student is learning about ${spaceName}.` : ''}

QUIZ CREATION INSTRUCTIONS:
- Create exactly ${questionCount} diverse questions
- Mix question types: multiple_choice, true_false, and short_answer
- Cover different topics from the learning materials
- If the student has wrong answers, include questions on those topics to reinforce learning
- Make questions progressively harder (start easy, end challenging)
- Each question should test genuine understanding, not just memorization
- Ensure variety - don't repeat similar questions

Return ONLY valid JSON in this exact format:
{
  "title": "Quiz title based on the topics covered",
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "The question text",
      "options": ["A", "B", "C", "D"],
      "answer": "The correct option text",
      "explanation": "Why this is correct",
      "topic": "Topic this question covers",
      "difficulty": "easy" | "medium" | "hard"
    },
    {
      "id": 2,
      "type": "true_false",
      "question": "A true/false statement",
      "answer": "True" | "False",
      "explanation": "Why this is true/false",
      "topic": "Topic",
      "difficulty": "medium"
    },
    {
      "id": 3,
      "type": "short_answer",
      "question": "A short answer question",
      "answer": "The expected answer (key points)",
      "explanation": "Full explanation",
      "topic": "Topic",
      "difficulty": "hard"
    }
  ]
}`

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a ${questionCount}-question quiz covering the learning materials provided. Make it comprehensive and educational.` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to generate quiz: ${response.statusText}`)
  }

  const data = await response.json()
  try {
    const result = JSON.parse(data.choices[0].message.content)
    return result
  } catch {
    throw new Error('Invalid quiz format received')
  }
}

export async function generateSlideshow(model, spaceName, slideCount, topic, context = {}, includeImages = false) {
  const { conversation = [], sources = [], flashcards = [] } = context

  // Build context from conversation
  const recentMessages = conversation.slice(-30)
  const conversationContext = recentMessages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n')

  // Build context from sources
  const sourcesContext = sources
    .map((s, i) => {
      let text = `Source ${i + 1}: ${s.title}`
      if (s.author) text += ` by ${s.author}`
      if (s.notes) text += `\nContent: ${s.notes}`
      return text
    })
    .join('\n\n')

  // Build context from flashcards
  const flashcardsContext = flashcards
    .map((f, i) => `Flashcard ${i + 1}: Q: ${f.front} A: ${f.back}`)
    .join('\n')

  const imageInstructions = includeImages ? `
- For each slide, include an "imageQuery" field with a 2-4 word search term for a stock photo
- CRITICAL RULES for imageQuery:
  1. Extract the main VISUAL subject from the slide's bullet points
  2. Use domain-specific nouns (e.g., "mitochondria cell", "stock chart analysis", "python code screen")
  3. Add descriptive modifiers (e.g., "close-up", "diagram", "professional", "laboratory")
  4. NEVER use abstract words like: concept, overview, introduction, summary, learning, understanding, information, basics
  5. For title/intro slides, use a visual representation of the main topic
  6. For conclusion slides, use an image of the key subject matter discussed
- GOOD examples:
  * Slide about cell biology → "plant cell microscope closeup"
  * Slide about French Revolution → "french revolution painting storming bastille"
  * Slide about JavaScript → "javascript code computer screen"
  * Slide about photosynthesis → "green leaf sunlight nature"
  * Slide about World War 2 → "world war 2 soldiers historical"
- BAD examples (will return irrelevant images): "introduction", "key points", "summary", "chapter 1", "basics"
- Each imageQuery must be UNIQUE across all slides` : ''

  const imageFormat = includeImages ? `,
      "imageQuery": "specific descriptive search term matching slide content"` : ''

  const systemPrompt = `You are an expert presentation designer. Create slides with FULL CONTENT that users can read and present directly.

LEARNING CONTEXT:
${conversationContext ? `\n--- CHAT HISTORY ---\n${conversationContext}\n` : ''}
${sourcesContext ? `\n--- SOURCES ---\n${sourcesContext}\n` : ''}
${flashcardsContext ? `\n--- FLASHCARDS ---\n${flashcardsContext}\n` : ''}
${!conversationContext && !sourcesContext && !flashcardsContext ? `The topic is ${spaceName}.` : ''}

SPECIFIC TOPIC FOCUS: ${topic || spaceName}

═══════════════════════════════════════════════════════════
SLIDE CONTENT RULES (Follow these exactly!)
═══════════════════════════════════════════════════════════

1. FULL EXPLANATORY CONTENT:
   - Each slide contains 2-3 paragraphs of readable content
   - Write in clear, presentation-ready language
   - Content should be complete enough to present directly
   - Include examples, explanations, and key details

2. ONE MAIN IDEA PER SLIDE:
   - Each slide focuses on ONE concept or topic
   - Break complex topics across multiple slides
   - Content should flow logically when presenting

3. MEANINGFUL TITLES:
   - BAD: "Introduction", "Overview", "Key Points"
   - GOOD: "How Photosynthesis Powers Life on Earth"
   - The title captures the slide's main message

4. PROGRESSIVE STRUCTURE:
   - Slide 1: Title slide with engaging hook
   - Early slides: Foundation and context
   - Middle slides: Core content with depth
   - Later slides: Advanced details and applications
   - Final slide: Summary with key takeaways

5. PRESENTATION-READY WRITING:
   - Use clear, engaging language
   - Include concrete examples
   - Define technical terms when first used
   - Connect ideas to real-world applications
${imageInstructions}

═══════════════════════════════════════════════════════════
EXAMPLE SLIDE:
═══════════════════════════════════════════════════════════

Title: "Photosynthesis: How Plants Create Their Own Food"

Content: "Photosynthesis is the remarkable process by which plants convert sunlight into chemical energy. This process takes place in specialized cell structures called chloroplasts, which contain the green pigment chlorophyll.

During photosynthesis, plants absorb carbon dioxide from the air and water from the soil. Using energy from sunlight, they transform these simple ingredients into glucose—a sugar that serves as food for the plant. As a bonus, this process releases oxygen into the atmosphere, which we breathe.

Nearly all life on Earth depends on photosynthesis. It's the foundation of most food chains and the source of the oxygen in our atmosphere."

═══════════════════════════════════════════════════════════

Create exactly ${slideCount} slides.

Return ONLY valid JSON in this exact format:
{
  "title": "Compelling presentation title",
  "subtitle": "Brief hook or context",
  "slides": [
    {
      "title": "Specific, meaningful slide title",
      "content": "2-3 paragraphs of full, presentation-ready content with explanations, examples, and details. Write complete thoughts that can be read directly during a presentation."${imageFormat}
    }
  ]
}`

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a ${slideCount}-slide presentation about "${topic || spaceName}".

REMEMBER:
- Each slide needs 2-3 paragraphs of full, readable content
- Titles must be specific and meaningful, not generic
- Content should be presentation-ready (can be read directly)
- Include examples and clear explanations.` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to generate slideshow: ${response.statusText}`)
  }

  const data = await response.json()
  try {
    return JSON.parse(data.choices[0].message.content)
  } catch {
    throw new Error('Invalid slideshow format received')
  }
}
