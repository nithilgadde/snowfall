// Extract YouTube video ID from various URL formats
export function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Fetch YouTube transcript using a free API
export async function fetchYouTubeTranscript(videoId) {
  try {
    // Using a free transcript API
    const response = await fetch(`/api/youtube-transcript/${videoId}`)

    if (!response.ok) {
      throw new Error('Failed to fetch transcript')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Transcript fetch error:', error)
    throw error
  }
}

// Get video metadata (title, description) using oembed
export async function fetchYouTubeMetadata(videoId) {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch video metadata')
    }

    const data = await response.json()
    return {
      title: data.title,
      author: data.author_name,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    }
  } catch (error) {
    console.error('Metadata fetch error:', error)
    return {
      title: 'YouTube Video',
      author: 'Unknown',
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    }
  }
}

// Fetch webpage content (simplified - would need server-side for full implementation)
export async function fetchWebpageContent(url) {
  // This would require a server-side proxy to avoid CORS
  // For now, we'll just store the URL and let the AI know about it
  return {
    url,
    type: 'webpage',
    content: null,
    note: 'Webpage content extraction requires server-side processing'
  }
}

// Process and add a source
export async function processSource(url) {
  const youtubeId = extractYouTubeId(url)

  if (youtubeId) {
    const metadata = await fetchYouTubeMetadata(youtubeId)

    let transcript = null
    let transcriptError = null

    try {
      transcript = await fetchYouTubeTranscript(youtubeId)
    } catch (error) {
      transcriptError = error.message
    }

    return {
      type: 'youtube',
      url,
      videoId: youtubeId,
      title: metadata.title,
      author: metadata.author,
      thumbnail: metadata.thumbnail,
      transcript: transcript?.text || null,
      transcriptError,
      status: transcript ? 'ready' : 'error'
    }
  }

  // For other URLs, just store the reference
  return {
    type: 'webpage',
    url,
    title: url,
    status: 'pending'
  }
}
