import { Link } from 'react-router-dom'
import { Calculator, Code, FlaskConical, Languages, Landmark, Brain, BookOpen } from 'lucide-react'

const iconMap = {
  calculator: Calculator,
  code: Code,
  flask: FlaskConical,
  languages: Languages,
  landmark: Landmark,
  brain: Brain,
  default: BookOpen
}

export default function SpaceCard({ space }) {
  const Icon = iconMap[space.icon] || iconMap.default

  return (
    <Link to={`/space/${space.id}`} className="space-card" style={{ '--accent': space.color }}>
      <div className="space-icon">
        <Icon size={28} />
      </div>
      <div className="space-info">
        <h3>{space.name}</h3>
        <p>{space.description}</p>
      </div>
      <div className="space-arrow">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
