import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from '@phosphor-icons/react'
import { getMemberImage } from '../memberImages'
import { loadOutfit } from '../outfitUtils'
import AccessoryRenderer from './AccessoryRenderer'

const LOCAL_PROFILES = new Set(['丁老师', '王静怡'])

// 从名字hash得到稳定动画类型
export const ANIM_TYPES = ['float', 'sway', 'bounce', 'breathe', 'wiggle']

export function getAnimType(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0
  return ANIM_TYPES[Math.abs(h) % ANIM_TYPES.length]
}

const ANIM_CSS = {
  float: { animation: 'char-float 3s ease-in-out infinite' },
  sway: { animation: 'char-sway 3.5s ease-in-out infinite', transformOrigin: 'bottom center' },
  bounce: { animation: 'char-bounce 2.8s ease-in-out infinite' },
  breathe: { animation: 'char-breathe 3.2s ease-in-out infinite' },
  wiggle: { animation: 'char-wiggle 3s ease-in-out infinite', transformOrigin: 'bottom center' },
}

export default function MemberCard({ member, size, style, onPointerDown, isDragging }) {
  const navigate = useNavigate()
  const localImage = getMemberImage(member.name)
  const avatarSrc = localImage || member.avatar_url
  const isLocal = typeof member.id === 'string' && member.id.startsWith('local-')
  const hasProfile = !isLocal || LOCAL_PROFILES.has(member.name)
  const movedRef = useRef(false)
  const outfit = loadOutfit(member.name)
  const charW = size || 75
  const charH = charW * (4/3)
  const animType = getAnimType(member.name)
  const anim = isDragging ? {} : ANIM_CSS[animType]

  const handlePointerDown = (e) => {
    movedRef.current = false
    onPointerDown(e)
  }

  const handleClick = () => {
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
      <div style={{
        width: charW, height: charH,
        position: 'relative', overflow: 'visible',
        pointerEvents: 'none',
        ...anim,
      }}>
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={member.name}
            draggable={false}
            style={{
              width: '100%', height: '100%',
              objectFit: 'contain',
              objectPosition: 'bottom center',
              position: 'relative', zIndex: 1,
            }}
          />
        ) : (
          <div style={{
            width: charW * 0.7, height: charW * 0.7, borderRadius: '50%', position: 'absolute',
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-subtle))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
          }}>
            <User size={charW * 0.32} color="#FFF" />
          </div>
        )}
        <AccessoryRenderer items={outfit} containerWidth={charW} />
      </div>
      <div style={{ fontSize: Math.round(charW * 0.15), fontWeight: 500, marginTop: 2, pointerEvents: 'none', userSelect: 'none' }}>
        {member.name}
      </div>
    </div>
  )
}
