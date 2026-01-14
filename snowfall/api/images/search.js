// Pexels API proxy for fetching open-source images
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { query, per_page = 1 } = req.query

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' })
  }

  const apiKey = process.env.PEXELS_API_KEY

  if (!apiKey) {
    // Fallback to placeholder images if no API key
    return res.status(200).json({
      photos: [{
        src: {
          large: `https://picsum.photos/seed/${encodeURIComponent(query)}/800/600`,
          medium: `https://picsum.photos/seed/${encodeURIComponent(query)}/640/480`
        },
        alt: query,
        photographer: 'Lorem Picsum'
      }]
    })
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${per_page}&orientation=landscape`,
      {
        headers: {
          'Authorization': apiKey
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.statusText}`)
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Pexels API error:', error)
    // Fallback to placeholder
    return res.status(200).json({
      photos: [{
        src: {
          large: `https://picsum.photos/seed/${encodeURIComponent(query)}/800/600`,
          medium: `https://picsum.photos/seed/${encodeURIComponent(query)}/640/480`
        },
        alt: query,
        photographer: 'Lorem Picsum'
      }]
    })
  }
}
