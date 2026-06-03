// SVG 服装配饰 — 纯矢量，可缩放，描边风格匹配卡通抠图
const ns = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"'

const raw = {
  // === 帽子类 ===
  cap: `<svg ${ns}><path d="M18 52 Q20 30 50 28 Q80 30 82 52 L90 50 Q85 22 50 20 Q15 22 10 50Z" fill="#4A90D9" stroke="#2C5F8A" stroke-width="2"/><rect x="12" y="50" width="76" height="6" rx="2" fill="#3A7BC8"/></svg>`,
  sunhat: `<svg ${ns}><ellipse cx="50" cy="42" rx="38" ry="8" fill="#F5DEB3" stroke="#C8A87C" stroke-width="1.5"/><ellipse cx="50" cy="35" rx="18" ry="16" fill="#FAEBD7" stroke="#C8A87C" stroke-width="1.5"/><rect x="42" y="16" width="16" height="20" rx="6" fill="#FAEBD7" stroke="#C8A87C" stroke-width="1.5"/></svg>`,
  beanie: `<svg ${ns}><rect x="20" y="30" width="60" height="40" rx="18" fill="#E74C3C" stroke="#A93226" stroke-width="1.5"/><rect x="20" y="62" width="60" height="10" rx="3" fill="#C0392B"/><circle cx="50" cy="12" r="10" fill="#E74C3C" stroke="#A93226" stroke-width="1.5"/></svg>`,
  cowboy: `<svg ${ns}><path d="M10 55 Q10 30 50 32 Q90 30 90 55 Q80 50 50 52 Q20 50 10 55Z" fill="#8B4513" stroke="#5C2E00" stroke-width="2"/><path d="M15 52 Q15 40 50 38 Q85 40 85 52" fill="#A0522D"/><path d="M8 56 Q30 54 50 56 Q70 54 92 56 Q70 62 50 60 Q30 62 8 56Z" fill="#8B4513" stroke="#5C2E00" stroke-width="1.5"/></svg>`,

  // === 眼镜类 ===
  roundGlasses: `<svg ${ns}><circle cx="34" cy="38" r="14" fill="none" stroke="#333" stroke-width="3"/><circle cx="66" cy="38" r="14" fill="none" stroke="#333" stroke-width="3"/><line x1="48" y1="38" x2="52" y2="38" stroke="#333" stroke-width="3"/><line x1="20" y1="36" x2="10" y2="42" stroke="#333" stroke-width="2.5"/><line x1="80" y1="36" x2="90" y2="42" stroke="#333" stroke-width="2.5"/></svg>`,
  heartGlasses: `<svg ${ns}><path d="M28 34 C28 26 40 20 40 28 C40 20 52 26 52 34 C52 44 40 50 40 50 C40 50 28 44 28 34Z" fill="none" stroke="#E91E63" stroke-width="3"/><path d="M48 34 C48 26 60 20 60 28 C60 20 72 26 72 34 C72 44 60 50 60 50 C60 50 48 44 48 34Z" fill="none" stroke="#E91E63" stroke-width="3"/><line x1="52" y1="36" x2="48" y2="36" stroke="#E91E63" stroke-width="3"/></svg>`,

  // === 身体服装 ===
  tie: `<svg ${ns}><polygon points="47,8 53,8 56,30 50,38 44,30" fill="#C0392B" stroke="#7B241C" stroke-width="1.5"/><polygon points="44,30 50,38 56,30 60,50 50,65 40,50" fill="#E74C3C" stroke="#A93226" stroke-width="1.5"/></svg>`,
  bowtie: `<svg ${ns}><path d="M50 36 L32 20 L32 52 Z" fill="#E74C3C" stroke="#A93226" stroke-width="1.5"/><path d="M50 36 L68 20 L68 52 Z" fill="#E74C3C" stroke="#A93226" stroke-width="1.5"/><circle cx="50" cy="36" r="5" fill="#C0392B"/></svg>`,
  scarf: `<svg ${ns}><path d="M15 25 Q30 30 50 28 Q70 30 85 25 L80 60 Q70 55 50 58 Q30 55 20 60Z" fill="#3498DB" stroke="#1F6FA0" stroke-width="1.5"/><path d="M20 55 L12 85 Q18 88 25 82 L28 60Z" fill="#3498DB" stroke="#1F6FA0" stroke-width="1.5"/><path d="M80 55 L88 85 Q82 88 75 82 L72 60Z" fill="#3498DB" stroke="#1F6FA0" stroke-width="1.5"/></svg>`,
  vest: `<svg ${ns}><path d="M30 10 L28 85 L45 90 L50 50 L55 90 L72 85 L70 10 Q50 5 30 10Z" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/><rect x="42" y="40" width="16" height="4" rx="2" fill="#34495E"/></svg>`,
  apron: `<svg ${ns}><path d="M30 8 Q50 4 70 8 L75 80 Q50 85 25 80Z" fill="#FFF" stroke="#DDD" stroke-width="2"/><path d="M30 8 Q25 2 22 10 L25 20" fill="none" stroke="#CCC" stroke-width="2.5"/><path d="M70 8 Q75 2 78 10 L75 20" fill="none" stroke="#CCC" stroke-width="2.5"/><circle cx="50" cy="40" r="8" fill="#FFB6C1" opacity="0.5"/></svg>`,
  jacket: `<svg ${ns}><path d="M25 8 Q50 5 75 8 L78 85 Q50 90 22 85Z" fill="#1E8449" stroke="#145A32" stroke-width="2"/><line x1="50" y1="10" x2="50" y2="78" stroke="#145A32" stroke-width="2"/><rect x="38" y="20" width="24" height="4" rx="2" fill="#27AE60"/><rect x="38" y="32" width="24" height="4" rx="2" fill="#27AE60"/><path d="M25 8 L45 14 L50 8" fill="#1E8449" stroke="#145A32" stroke-width="1"/><path d="M75 8 L55 14 L50 8" fill="#1E8449" stroke="#145A32" stroke-width="1"/></svg>`,

  // === 头饰 ===
  halo: `<svg ${ns}><ellipse cx="50" cy="12" rx="22" ry="6" fill="none" stroke="#FFD700" stroke-width="3" opacity="0.8"/><ellipse cx="50" cy="12" rx="22" ry="6" fill="none" stroke="#FFF8DC" stroke-width="1.5" opacity="0.5"/></svg>`,
  flowerCrown: `<svg ${ns}><circle cx="25" cy="22" r="8" fill="#FF69B4"/><circle cx="25" cy="22" r="3" fill="#FFD700"/><circle cx="50" cy="14" r="9" fill="#FF1493"/><circle cx="50" cy="14" r="3.5" fill="#FFD700"/><circle cx="75" cy="22" r="8" fill="#FF69B4"/><circle cx="75" cy="22" r="3" fill="#FFD700"/><circle cx="12" cy="32" r="5" fill="#DB7093"/><circle cx="12" cy="32" r="2" fill="#FFD700"/><circle cx="88" cy="32" r="5" fill="#DB7093"/><circle cx="88" cy="32" r="2" fill="#FFD700"/><path d="M12 32 Q30 18 50 14 Q70 18 88 32" fill="none" stroke="#228B22" stroke-width="2.5"/></svg>`,
  ears: `<svg ${ns}><ellipse cx="18" cy="30" rx="14" ry="22" fill="#FFB6C1" stroke="#FF69B4" stroke-width="1.5" transform="rotate(-15 18 30)"/><ellipse cx="18" cy="30" rx="8" ry="14" fill="#FFC0CB" transform="rotate(-15 18 30)"/><ellipse cx="82" cy="30" rx="14" ry="22" fill="#FFB6C1" stroke="#FF69B4" stroke-width="1.5" transform="rotate(15 82 30)"/><ellipse cx="82" cy="30" rx="8" ry="14" fill="#FFC0CB" transform="rotate(15 82 30)"/></svg>`,

  // === 背包 ===
  backpack: `<svg ${ns}><rect x="22" y="25" width="35" height="45" rx="10" fill="#E67E22" stroke="#A04000" stroke-width="2"/><rect x="28" y="55" width="23" height="8" rx="3" fill="#D35400"/><path d="M30 30 L30 12 Q30 6 40 6 Q50 6 50 12 L50 30" fill="none" stroke="#A04000" stroke-width="3"/><circle cx="36" cy="45" r="3" fill="#F1C40F"/></svg>`,
}

// 转为 data URI
export const SVG_CLOTHING = {}
for (const [key, svg] of Object.entries(raw)) {
  // 清理空白并 encode
  const cleaned = svg.replace(/\s+/g, ' ').trim()
  SVG_CLOTHING[key] = 'data:image/svg+xml,' + encodeURIComponent(cleaned)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22')
}

// 分类
export const SVG_CLOTHING_CATS = {
  '帽子': ['cap', 'sunhat', 'beanie', 'cowboy'],
  '眼镜': ['roundGlasses', 'heartGlasses'],
  '领饰': ['tie', 'bowtie', 'scarf'],
  '外套': ['vest', 'apron', 'jacket'],
  '头饰': ['halo', 'flowerCrown', 'ears'],
  '背包': ['backpack'],
}

export const SVG_CAT_NAMES = Object.keys(SVG_CLOTHING_CATS)

// 获取名称映射
export const SVG_NAMES = {
  cap: '棒球帽', sunhat: '遮阳帽', beanie: '毛线帽', cowboy: '牛仔帽',
  roundGlasses: '圆框镜', heartGlasses: '爱心镜',
  tie: '领带', bowtie: '领结', scarf: '围巾',
  vest: '马甲', apron: '围裙', jacket: '夹克',
  halo: '天使光环', flowerCrown: '花环', ears: '猫耳',
  backpack: '书包',
}
