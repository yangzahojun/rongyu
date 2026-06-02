import { useNavigate } from 'react-router-dom'
import { User } from '@phosphor-icons/react'
import { getMemberImage } from '../memberImages'

export default function MemberCard({ member }) {
  const navigate = useNavigate()
  const localImage = getMemberImage(member.name)
  const avatarSrc = localImage || member.avatar_url
  const isLocal = typeof member.id === 'string' && member.id.startsWith('local-')

  const handleClick = () => {
    if (!isLocal) navigate(`/member/${member.id}`)
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={isLocal ? -1 : 0}
      aria-label={isLocal ? member.name : `查看${member.name}的资料`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}
      style={{
        cursor: isLocal ? 'default' : 'pointer',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
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
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'bottom center',
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
      <div style={{ fontSize: 12, fontWeight: 500, marginTop: 2 }}>{member.name}</div>
    </div>
  )
}
