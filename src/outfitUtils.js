export const ACCESSORY_CATS = {
  '头饰': ['👑','🎓','🎩','🤠','🎀','👒','🌸','⭐','🎧','🍀','🐰','🐱','🐶','🦊'],
  '眼镜': ['👓','🕶️','🤓','🥽'],
  '脸饰': ['😷','💋','🎭'],
  '颈饰': ['🧣','👔','🎗️','💎','💍'],
  '手持': ['🎤','📚','⚽','🎸','🔮','💐','🏀','🎈','🗡️','🛡️','🔔','🎯','✈️','🚀','🧸','🍭','🎪','☂️'],
  '特效': ['🌟','❤️','🌻','🌙','☀️','🍄','🫧','💡','🦋','🪽','🪷','✨','💫','🌈','💖','🔥'],
  '伙伴': ['🐼','🐨','🐸','🐙','🦀','🐉','🪿','🦜','🐞','🦄'],
}

export const CAT_NAMES = Object.keys(ACCESSORY_CATS)

export function loadOutfit(name) {
  try {
    const saved = JSON.parse(localStorage.getItem(`rongyu_outfit2_${name}`))
    if (Array.isArray(saved)) return saved
  } catch {}
  return []
}

export function saveOutfit(name, items) {
  try { localStorage.setItem(`rongyu_outfit2_${name}`, JSON.stringify(items)) } catch {}
}
