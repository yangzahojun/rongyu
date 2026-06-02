import { supabase } from './supabase'

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

// 配饰字号与容器宽度的比例 (editor: 28/140=0.2)
export const ACC_FONT_RATIO = 0.2

export const DEFAULT_MEMBER_SIZE = 75

// 设备检测
export function getDevice() {
  if (typeof window === 'undefined') return 'desktop'
  return window.innerWidth <= 768 ? 'mobile' : 'desktop'
}

export function deviceKey(base) {
  return `${base}_${getDevice()}`
}

// --- 配饰 CRUD（共享：Supabase优先，localStorage兜底） ---

export function loadOutfit(name) {
  try {
    const saved = JSON.parse(localStorage.getItem(`rongyu_outfit2_${name}`))
    if (Array.isArray(saved)) return saved
  } catch {}
  return []
}

export function saveOutfit(name, items) {
  try { localStorage.setItem(`rongyu_outfit2_${name}`, JSON.stringify(items)) } catch {}
  // 尝试同步到Supabase（静默失败）
  syncToSupabase(`outfit_${name}`, items)
}

// --- 公共画布状态 ---

export function loadCanvasState() {
  const key = deviceKey('rongyu_canvas')
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    if (saved) return saved
  } catch {}
  return { positions: {}, sizes: {} }
}

export function saveCanvasState(state) {
  const key = deviceKey('rongyu_canvas')
  try { localStorage.setItem(key, JSON.stringify(state)) } catch {}
  syncToSupabase(`canvas_${getDevice()}`, state)
}

// Supabase同步（后台静默，失败不影响）
async function syncToSupabase(key, value) {
  try {
    await supabase.from('shared_state').upsert({
      key: key,
      value: JSON.stringify(value),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' })
  } catch {}
}

// 从Supabase拉取共享状态
export async function fetchSharedState() {
  try {
    const { data } = await supabase.from('shared_state').select('*')
    if (data) {
      for (const row of data) {
        try { localStorage.setItem(row.key, row.value) } catch {}
      }
    }
  } catch {}
}
