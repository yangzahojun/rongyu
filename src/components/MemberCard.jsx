import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from '@phosphor-icons/react'
import { getMemberImage } from '../memberImages'
import { loadOutfit } from '../outfitUtils'
import AccessoryRenderer from './AccessoryRenderer'

const LOCAL_PROFILES = new Set(['丁老师', '王静怡'])

// 每个名字hash到一个主动画+随机延迟+偶尔跳动画
export function getAnimConfig(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0
  const abs = Math.abs(h)
  const types = ['float', 'sway', 'bounce', 'breathe', 'wiggle']
  const type = types[abs % types.length]
  const dur = 2.5 + (abs % 15) * 0.1 // 2.5s ~ 4s
  const delay = (abs % 12) * 0.3 // 0 ~ 3.6s 随机相位
  const hopDelay = 8 + (abs % 12) // 8s ~ 20s 偶尔跳一下
  return { type, dur, delay, hopDelay }
}

const ANIM_KEYFRAMES = {
  float:    { primary: 'char-float', twinkle: 'none', hop: 'none' },
  sway:     { primary: 'char-sway', twinkle: 'none', hop: 'none' },
  bounce:   { primary: 'char-bounce', twinkle: 'none', hop: 'none' },
  breathe:  { primary: 'char-breathe', twinkle: 'char-twinkle', hop: 'none' },
  wiggle:   { primary: 'char-wiggle', twinkle: 'char-twinkle', hop: 'none' },
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
  const keys = ANIM_KEYFRAMES[animCfg.type]
  const moved = useRef(false)

  const handlePointerDown = (e) => {
    moved.current = false
    onPointerDown(e)
  }

  const handleClick = () => {
    if (moved.current) return
    if (hasProfile) navigate(`/member/${member.id}`)
  }

  // 非拖动时播放动画
  const animStyle = isDragging ? {} : {
    animationName: `${keys.primary}, char-hop`,
    animationDuration: `${animCfg.dur}s, 0.4s`,
    animationDelay: `${animCfg.delay}s, ${animCfg.hopDelay}s`,
    animationIterationCount: 'infinite, infinite',
    animationTimingFunction: 'ease-in-out, ease-out',
    transformOrigin: 'bottom center',
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
      <div style={{
        width: charW, height: charH,
        position: 'relative', overflow: 'visible',
        pointerEvents: 'none',
        ...animStyle,
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
      <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4, pointerEvents: 'none', userSelect: 'none' }}>
        {member.name}
      </div>
    </div>
  )
}
