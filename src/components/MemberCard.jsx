import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import CharacterAnim from './CharacterAnim'

const LOCAL_PROFILES = new Set(['丁老师', '王静怡'])

export default function MemberCard({ member, size, style, onPointerDown, isDragging }) {
  const navigate = useNavigate()
  const isLocal = typeof member.id === 'string' && member.id.startsWith('local-')
  const hasProfile = !isLocal || LOCAL_PROFILES.has(member.name)
  const charW = size || 75
  const moved = useRef(false)

  const handlePointerDown = (e) => {
    moved.current = false
    onPointerDown(e)
  }

  const handleClick = () => {
    if (moved.current) return
    if (hasProfile) navigate(`/member/${member.id}`)
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={() => { moved.current = true }}
      onClick={handleClick}
      role="button"
      tabIndex={hasProfile ? 0 : -1}
      aria-label={hasProfile ? `查看${member.name}的资料` : member.name}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (hasProfile) navigate(`/member/${member.id}`) } }}
      style={{
        position: 'absolute',
        width: charW,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        touchAction: 'none',
        userSelect: 'none',
        ...style,
      }}
    >
      <CharacterAnim member={member} size={charW} isDragging={isDragging} />
      <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4, pointerEvents: 'none', userSelect: 'none' }}>
        {member.name}
      </div>
    </div>
  )
}
