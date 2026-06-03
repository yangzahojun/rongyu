import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from '@phosphor-icons/react'
import { getMemberImage } from '../memberImages'
import { loadOutfit } from '../outfitUtils'
import AccessoryRenderer from './AccessoryRenderer'

const LOCAL_PROFILES = new Set(['丁老师', '王静怡'])

// 每个人物分配一组具体动作（按名字hash稳定）
export function getAnimConfig(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0
  const abs = Math.abs(h)
  const actions = [
    { name: 'walk',   dur: 3 + (abs % 10) * 0.2, delay: (abs % 8) * 0.5 },
    { name: 'wave',   dur: 4 + (abs % 6) * 0.3, delay: 1 + (abs % 5) * 0.7 },
    { name: 'nod',    dur: 2 + (abs % 8) * 0.15, delay: 0.5 + (abs % 4) * 0.6 },
    { name: 'jump',   dur: 5 + (abs % 7) * 0.4, delay: 2 + (abs % 6) * 0.8 },
    { name: 'idle',   dur: 2.5 + (abs % 10) * 0.2, delay: (abs % 7) * 0.4 },
  ]
  return actions
}

export default function MemberCard({ member, size, style, onPointerDown, isDragging }) {
  const navigate = useNavigate()
  const localImage = getMemberImage(member.name)
  const avatarSrc = localImage || member.avatar_url
  const isLocal = typeof member.id === 'string' && member.id.startsWith('local-')
  const hasProfile = !isLocal || LOCAL_PROFILES.has(member.name)
  const outfit = loadOutfit(member.name)
  const charW = size || 75
  const charH = charW * (4/3)
  const animCfg = getAnimConfig(member.name)
  const moved = useRef(false)

  const handlePointerDown = (e) => {
    moved.current = false
    onPointerDown(e)
  }

  const handleClick = () => {
    if (moved.current) return
    if (hasProfile) navigate(`/member/${member.id}`)
  }

  // 构建复合动画字符串
  const animStr = isDragging ? 'none' : animCfg.map((a, i) => {
    const name = `char-${a.name}-${(i % 3)}`
    return `${name} ${a.dur}s ease-in-out ${a.delay}s infinite`
  }).join(', ')

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
      <div style={{
        width: charW, height: charH,
        position: 'relative', overflow: 'visible',
        pointerEvents: 'none',
        animation: animStr,
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
              animation: isDragging ? 'none' : `char-breathe-sub ${2.8 + (charW % 5) * 0.2}s ease-in-out infinite`,
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
      <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4, pointerEvents: 'none', userSelect: 'none' }}>
        {member.name}
      </div>
    </div>
  )
}
