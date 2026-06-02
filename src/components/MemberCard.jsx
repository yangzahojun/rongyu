import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from '@phosphor-icons/react'
import { getMemberImage } from '../memberImages'

const LOCAL_PROFILES = new Set(['丁老师', '王静怡'])
const DRAG_THRESHOLD = 5

export default function MemberCard({ member, style, onPointerDown }) {
  const navigate = useNavigate()
  const localImage = getMemberImage(member.name)
  const avatarSrc = localImage || member.avatar_url
  const isLocal = typeof member.id === 'string' && member.id.startsWith('local-')
  const hasProfile = !isLocal || LOCAL_PROFILES.has(member.name)
  const startRef = useRef({ x: 0, y: 0 })
  const movedRef = useRef(false)

  const handlePointerDown = (e) => {
    startRef.current = { x: e.clientX, y: e.clientY }
    movedRef.current = false
    onPointerDown(e)
  }

  const handleClick = (e) => {
    if (movedRef.current) return
    if (hasProfile) navigate(`/member/${member.id}`)
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={() => { movedRef.current = true }}
      onClick={handleClick}
      role="button"
      tabIndex={hasProfile ? 0 : -1}
      aria-label={hasProfile ? `查看${member.name}的资料` : member.name}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (hasProfile) navigate(`/member/${member.id}`) } }}
      style={{
        position: 'absolute',
        width: 75,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        touchAction: 'none',
        userSelect: 'none',
        ...style,
      }}
    >
      <div style={{
        width: '100%',
        aspectRatio: '3/4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        pointerEvents: 'none',
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
      <div style={{ fontSize: 11, fontWeight: 500, marginTop: 2, pointerEvents: 'none' }}>
        {member.name}
      </div>
    </div>
  )
}
