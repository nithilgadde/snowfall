import { useState } from 'react'
import { X, Calculator, Code, FlaskConical, Languages, Landmark, Brain, BookOpen } from 'lucide-react'
import { useSpaces } from '../contexts/SpacesContext'

const ICONS = [
  { id: 'calculator', Icon: Calculator },
  { id: 'code', Icon: Code },
  { id: 'flask', Icon: FlaskConical },
  { id: 'languages', Icon: Languages },
  { id: 'landmark', Icon: Landmark },
  { id: 'brain', Icon: Brain },
  { id: 'default', Icon: BookOpen }
]

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16']

export default function EditSpaceModal({ space, onClose }) {
  const [name, setName] = useState(space.name)
  const [description, setDescription] = useState(space.description)
  const [icon, setIcon] = useState(space.icon || 'default')
  const [color, setColor] = useState(space.color || '#6366f1')
  const { updateSpace } = useSpaces()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    updateSpace(space.id, {
      name: name.trim(),
      description: description.trim(),
      icon,
      color
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Space</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="edit-name">Space Name</label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Machine Learning"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-description">Description</label>
            <input
              id="edit-description"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What will you learn here?"
            />
          </div>

          <div className="form-group">
            <label>Icon</label>
            <div className="icon-picker">
              {ICONS.map(({ id, Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`icon-option ${icon === id ? 'selected' : ''}`}
                  onClick={() => setIcon(id)}
                  style={{ '--icon-color': icon === id ? color : 'var(--text-muted)' }}
                >
                  <Icon size={20} />
                </button>
              ))}
            </div>
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
