export const ACCESSORY_LIST = [
  '👑','🎓','🎩','🤠','🎀','🌸','⭐','🐰','🐱','🎧','☂️','🍀','💎','🪷',
  '👓','🕶️','🤓','🥽','😷','💋','🎭','🧣','👔','🎗️','💍','👒','🪽',
  '🎤','📚','⚽','🎸','🔮','💐','🏀','🎈','🌟','❤️','🍭','🦋','🌻',
  '🎯','✈️','🚀','🗡️','🛡️','🔔','💡','🎪','🧸','🫧','🍄','🌙','☀️',
  '🦄','🐶','🐱','🐼','🐨','🦊','🐸','🐙','🦀','🐉','🪿','🦜','🐞',
]

export const BG_EFFECTS = ['✨','💫','🌈','💖','🔥','🎵','🌺','⭐','❄️','🫧']

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
