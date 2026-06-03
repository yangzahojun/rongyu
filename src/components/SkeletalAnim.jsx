import { useMemo } from 'react'
import { getMemberImage } from '../memberImages'
import { loadOutfit } from '../outfitUtils'
import AccessoryRenderer from './AccessoryRenderer'

function hashName(n) { let h=0; for(let i=0;i<n.length;i++) h=((h<<5)-h+n.charCodeAt(i))|0; return Math.abs(h) }

export function getSkelConfig(name) {
  const h = hashName(name)
  return {
    wDur: 2.8+(h%10)*0.15, wDel:(h%7)*0.5, armSwing:5+(h%5), legSwing:4+(h%4),
    nDur: 1.8+(h%4)*0.15,  nDel:(h%3)*0.5,  nodAng:4+(h%3),
    iDur: 3+(h%6)*0.2,     iDel:(h%5)*0.6,
  }
}

// 身体部件窗口 (占容器百分比, object-fit:cover保证所有窗口内图像对齐)
const REGS = [
  { k:'leftLeg',  x:16,y:52,w:34,h:48, z:1  },
  { k:'rightLeg', x:50,y:52,w:34,h:48, z:2  },
  { k:'torso',    x:22,y:20,w:56,h:44, z:3  },
  { k:'leftArm',  x:0, y:16,w:32,h:44, z:5  },
  { k:'rightArm', x:68,y:16,w:32,h:44, z:6  },
  { k:'head',     x:28,y:0, w:44,h:26, z:8  },
]

const PIVOTS = {
  leftArm:'100% 0%', rightArm:'0% 0%',
  leftLeg:'50% 0%', rightLeg:'50% 0%',
  head:'50% 100%', torso:'50% 0%',
}

export default function SkeletalAnim({ member, size, isDragging }) {
  const avatarSrc = getMemberImage(member.name) || member.avatar_url
  const outfit = loadOutfit(member.name)
  const charW = size||75, charH = charW*(4/3)
  const cfg = getSkelConfig(member.name)
  const isArm = k => k==='leftArm'||k==='rightArm'
  const isLeg = k => k==='leftLeg'||k==='rightLeg'

  if (!avatarSrc) return (
    <div style={{width:charW,height:charH,position:'relative',pointerEvents:'none'}}>
      <div style={{width:charW*.7,height:charW*.7,borderRadius:'50%',position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'linear-gradient(135deg,var(--color-brand-primary),var(--color-brand-subtle))',zIndex:1}}/>
    </div>
  )

  return (
    <div style={{width:charW,height:charH,position:'relative',overflow:'visible',pointerEvents:'none'}}>
      {/* 底图：完整人物不动 */}
      <img src={avatarSrc} alt="" draggable={false} style={{
        position:'absolute',inset:0,width:'100%',height:'100%',
        objectFit:'cover',objectPosition:'bottom center',zIndex:1,
      }}/>

      {/* 部件层：各自独立动画 */}
      {REGS.map(r => {
        let anim='none'
        if (!isDragging) {
          if (isArm(r.k)) {
            const nm = r.k==='leftArm' ? 'puppet-arm-l' : 'puppet-arm-r'
            anim = `${nm} ${cfg.wDur}s ease-in-out ${cfg.wDel}s infinite`
          } else if (isLeg(r.k)) {
            const nm = r.k==='leftLeg' ? 'puppet-leg-l' : 'puppet-leg-r'
            anim = `${nm} ${cfg.wDur}s ease-in-out ${cfg.wDel}s infinite`
          } else if (r.k==='head') {
            anim = `puppet-nod ${cfg.nDur}s ease-in-out ${cfg.nDel}s infinite`
          } else {
            anim = `puppet-breathe ${cfg.iDur}s ease-in-out ${cfg.iDel}s infinite`
          }
        }

        return (
          <div key={r.k} style={{
            position:'absolute',
            left:`${r.x}%`, top:`${r.y}%`,
            width:`${r.w}%`, height:`${r.h}%`,
            overflow:'hidden',
            transformOrigin: PIVOTS[r.k],
            zIndex: r.z,
            animation: anim,
            '--swing': isArm(r.k) ? `${cfg.armSwing}deg` : isLeg(r.k) ? `${cfg.legSwing}deg` : undefined,
            '--nod': r.k==='head' ? `${cfg.nodAng}deg` : undefined,
          }}>
            <img src={avatarSrc} alt="" draggable={false} style={{
              position:'absolute',inset:0,
              width:'100%',height:'100%',
              objectFit:'cover',objectPosition:'bottom center',
            }}/>
          </div>
        )
      })}

      {/* 配饰 */}
      <div style={{position:'absolute',inset:0,zIndex:20}}>
        <AccessoryRenderer items={outfit} containerWidth={charW}/>
      </div>
    </div>
  )
}
