import { getMemberImage } from '../memberImages'
import { loadOutfit } from '../outfitUtils'
import AccessoryRenderer from './AccessoryRenderer'

function hashName(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0
  return Math.abs(h)
}

const ACTIONS = ['walk', 'wave', 'nod', 'jump', 'idle', 'swing', 'stretch', 'bounce']
const NAMES = { walk:'走路', wave:'招手', nod:'点头', jump:'跳跃', idle:'待机', swing:'摇摆', stretch:'伸展', bounce:'弹跳' }

export function getBoneConfig(name) {
  const h = hashName(name)
  const action = ACTIONS[h % ACTIONS.length]
  const dur = 2 + (h % 15) * 0.2
  const delay = (h % 9) * 0.4
  return { action, dur, delay, name: NAMES[action] }
}

export default function CharacterAnim({ member, size, isDragging }) {
  const avatarSrc = getMemberImage(member.name) || member.avatar_url
  const outfit = loadOutfit(member.name)
  const charW = size || 75
  const charH = charW * (4 / 3)
  const cfg = getBoneConfig(member.name)

  // 每种动作定义 pivot + 关键帧
  const pivots = {
    walk:   '50% 100%',
    wave:   '65% 28%',
    nod:    '50% 22%',
    jump:   '50% 100%',
    idle:   '50% 65%',
    swing:  '50% 100%',
    stretch:'50% 50%',
    bounce: '50% 100%',
  }

  const animName = isDragging ? 'none' : `char-${cfg.action}`

  return (
    <div style={{
      width: charW, height: charH,
      position: 'relative', overflow: 'visible',
      pointerEvents: 'none',
      transformOrigin: pivots[cfg.action] || '50% 65%',
      animation: isDragging ? 'none' : `${animName} ${cfg.dur}s ease-in-out ${cfg.delay}s infinite`,
    }}>
      {avatarSrc ? (
        <img src={avatarSrc} alt="" draggable={false} style={{
          width: '100%', height: '100%',
          objectFit: 'contain', objectPosition: 'bottom center',
          position: 'relative', zIndex: 1,
        }} />
      ) : (
        <div style={{
          width: charW*0.7, height: charW*0.7, borderRadius: '50%',
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-subtle))',
          zIndex: 1,
        }} />
      )}
      <AccessoryRenderer items={outfit} containerWidth={charW} />
    </div>
  )
}

export { ACTIONS, NAMES }
