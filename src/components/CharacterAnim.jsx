import { getMemberImage } from '../memberImages'
import { loadOutfit } from '../outfitUtils'
import AccessoryRenderer from './AccessoryRenderer'

function hashName(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0
  return Math.abs(h)
}

const ANIMS = ['float', 'sway', 'breathe']

export function getBoneConfig(name) {
  const h = hashName(name)
  return {
    type: ANIMS[h % ANIMS.length],
    dur: 2.5 + (h % 10) * 0.2,
    del: (h % 7) * 0.4,
  }
}

export default function CharacterAnim({ member, size, isDragging }) {
  const avatarSrc = getMemberImage(member.name) || member.avatar_url
  const outfit = loadOutfit(member.name)
  const charW = size || 75
  const charH = charW * (4 / 3)
  const cfg = getBoneConfig(member.name)

  const anim = isDragging ? 'none' : `char-${cfg.type} ${cfg.dur}s ease-in-out ${cfg.del}s infinite`

  return (
    <div style={{
      width: charW, height: charH,
      position: 'relative', overflow: 'visible',
      pointerEvents: 'none',
      transformOrigin: '50% 100%',
      animation: anim,
    }}>
      {avatarSrc ? (
        <img src={avatarSrc} alt="" draggable={false} style={{
          width: '100%', height: '100%',
          objectFit: 'contain', objectPosition: 'bottom center',
          position: 'relative', zIndex: 1,
        }} />
      ) : (
        <div style={{
          width: charW * 0.7, height: charW * 0.7, borderRadius: '50%',
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
