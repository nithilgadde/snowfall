import { useState } from 'react'
import { X } from 'lucide-react'
import { useSpaces } from '../contexts/SpacesContext'
import { useNavigate } from 'react-router-dom'

const ICONS = ['calculator', 'code', 'flask', 'languages', 'landmark', 'brain']
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16']

export default function CreateSpaceModal({ onClose, initialName = '' }) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('calculator')
  const [color, setColor] = useState('#6366f1')
  const { addSpace } = useSpaces()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    const newSpace = addSpace({
      name: name.trim(),
      description: description.trim() || `Learn about ${name}`,
      icon,
      color
    })
    onClose()
    navigate(`/space/${newSpace.id}`)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Learning Space</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Space Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Machine Learning"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What will you learn here?"
            />
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-picker">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-option ${color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>
              Create Space
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
