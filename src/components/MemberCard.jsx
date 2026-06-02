import { useNavigate } from 'react-router-dom'
import { User } from '@phosphor-icons/react'
import { getMemberImage } from '../memberImages'

export default function MemberCard({ member, index, onDragStart, onDragOver, onDragEnd, onDrop, isDragging }) {
  const navigate = useNavigate()
  const localImage = getMemberImage(member.name)
  const avatarSrc = localImage || member.avatar_url
  const isLocal = typeof member.id === 'string' && member.id.startsWith('local-')

  const handleClick = () => {
    if (!isLocal) navigate(`/member/${member.id}`)
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, index)}
      onClick={handleClick}
      role="button"
      tabIndex={isLocal ? -1 : 0}
      aria-label={isLocal ? member.name : `查看${member.name}的资料`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: isDragging ? 0.4 : 1,
        transition: 'opacity 0.15s',
        position: 'relative',
      }}
    >
      <div style={{
        width: '100%',
        aspectRatio: '3/4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={member.name}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'bottom center',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-subtle))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={24} color="#FFF" />
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, fontWeight: 500, marginTop: 2, userSelect: 'none' }}>
        {member.name}
      </div>
    </div>
  )
}
