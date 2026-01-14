import { useState } from 'react'
import { useSpaces } from '../contexts/SpacesContext'
import { extractYouTubeId, fetchYouTubeMetadata } from '../services/sources'
import { Plus, Trash2, Youtube, FileText, Link as LinkIcon, Loader, X } from 'lucide-react'

export default function SourcesPanel({ spaceId }) {
  const { getSources, addSource, removeSource, updateSource } = useSpaces()
  const sources = getSources(spaceId)

  const [showAddModal, setShowAddModal] = useState(false)
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAddSource = async (e) => {
    e.preventDefault()
    if (!url.trim() && !notes.trim()) return

    setLoading(true)
    setError(null)

    try {
      const youtubeId = extractYouTubeId(url)

      if (youtubeId) {
        // YouTube video
        const metadata = await fetchYouTubeMetadata(youtubeId)
        addSource(spaceId, {
          type: 'youtube',
          url: url.trim(),
          videoId: youtubeId,
          title: metadata.title,
          author: metadata.author,
          thumbnail: metadata.thumbnail,
          notes: notes.trim(),
          transcript: null // User can paste transcript manually
        })
      } else if (url.trim()) {
        // Generic URL
        addSource(spaceId, {
          type: 'link',
          url: url.trim(),
          title: url.trim(),
          notes: notes.trim()
        })
      } else {
        // Just notes
        addSource(spaceId, {
          type: 'note',
          title: 'Notes',
          notes: notes.trim()
        })
      }

      setUrl('')
      setNotes('')
      setShowAddModal(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (sourceId) => {
    if (confirm('Remove this source?')) {
      removeSource(spaceId, sourceId)
    }
  }

  const getSourceIcon = (type) => {
    switch (type) {
      case 'youtube': return <Youtube size={20} />
      case 'link': return <LinkIcon size={20} />
      default: return <FileText size={20} />
    }
  }

  return (
    <div className="sources-panel">
      <div className="sources-header">
        <h3>Learning Sources</h3>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>Add Source</span>
        </button>
      </div>

      {sources.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>No Sources Yet</h3>
          <p>Add YouTube videos, links, or notes to help the AI teach you from specific content.</p>
        </div>
      ) : (
        <div className="sources-list">
          {sources.map(source => (
            <div key={source.id} className="source-card">
              <div className="source-icon" data-type={source.type}>
                {getSourceIcon(source.type)}
              </div>

              <div className="source-content">
                {source.type === 'youtube' && source.thumbnail && (
                  <img src={source.thumbnail} alt="" className="source-thumbnail" />
                )}
                <div className="source-info">
                  <h4>{source.title}</h4>
                  {source.author && <span className="source-author">{source.author}</span>}
                  {source.url && (
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="source-url">
                      {source.url}
                    </a>
                  )}
                  {source.notes && <p className="source-notes">{source.notes}</p>}
                </div>
              </div>

              <button className="btn-icon source-delete" onClick={() => handleDelete(source.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Source</h2>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSource}>
              <div className="form-group">
                <label htmlFor="source-url">YouTube URL or Link (optional)</label>
                <input
                  id="source-url"
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="source-notes">
                  Notes / Transcript (optional)
                  <span className="label-hint">Paste video transcript or add your own notes</span>
                </label>
                <textarea
                  id="source-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Paste transcript or add notes about this source..."
                  rows={6}
                />
              </div>

              {error && <div className="form-error">{error}</div>}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || (!url.trim() && !notes.trim())}
                >
                  {loading ? (
                    <>
                      <Loader size={18} className="spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span>Add Source</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
