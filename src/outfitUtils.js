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
export const ACC_FONT_RATIO = 0.2
export const DEFAULT_MEMBER_SIZE = 75

// 设备检测
export function getDevice() {
  if (typeof window === 'undefined') return 'desktop'
  return window.innerWidth <= 768 ? 'mobile' : 'desktop'
}

// ============== localStorage 读写 ==============

export function loadOutfit(name) {
  try {
    const saved = JSON.parse(localStorage.getItem(`rongyu_outfit2_${name}`))
    if (Array.isArray(saved)) return saved
  } catch {}
  return []
}

export function saveOutfit(name, items) {
  try { localStorage.setItem(`rongyu_outfit2_${name}`, JSON.stringify(items)) } catch {}
  // 实时同步到 Supabase
  syncToSupabase(`outfit_${name}`, items)
}

export function loadCanvasState() {
  const key = `rongyu_canvas_${getDevice()}`
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    if (saved) return saved
  } catch {}
  return { positions: {}, sizes: {} }
}

export function saveCanvasState(state) {
  const key = `rongyu_canvas_${getDevice()}`
  try { localStorage.setItem(key, JSON.stringify(state)) } catch {}
  syncToSupabase(`canvas_${getDevice()}`, state)
}

// ============== Supabase 同步 ==============

// 写入 Supabase（后台静默，不阻塞UI）
async function syncToSupabase(dbKey, value) {
  try {
    await supabase.from('shared_state').upsert({
      key: dbKey,
      value: JSON.stringify(value),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' })
  } catch {}
}

// 从 Supabase 拉取所有共享状态 → 写入对应 localStorage key
export async function fetchSharedState() {
  try {
    const { data } = await supabase.from('shared_state').select('*')
    if (!data) return

    const device = getDevice()
    for (const row of data) {
      try {
        const dbKey = row.key // e.g. "outfit_杨赵俊" or "canvas_mobile"
        const localKey = supabaseKeyToLocal(dbKey, device)
        if (localKey) {
          // row.value 是 JSON 字符串，直接写入 localStorage
          localStorage.setItem(localKey, row.value)
        }
      } catch {}
    }
  } catch {}
}

// 映射 Supabase key → localStorage key
function supabaseKeyToLocal(dbKey, device) {
  if (dbKey.startsWith('outfit_')) {
    return 'rongyu_outfit2_' + dbKey.slice(7)
  }
  if (dbKey === `canvas_${device}`) {
    return `rongyu_canvas_${device}`
  }
  return null
}

// ============== 全局同步 Hook ==============

let syncTimer = null
let syncCallbacks = []

// 注册回调：Supabase 有新数据时触发
export function onSharedStateChange(callback) {
  syncCallbacks.push(callback)
  return () => { syncCallbacks = syncCallbacks.filter(cb => cb !== callback) }
}

function notifyCallbacks() {
  syncCallbacks.forEach(cb => { try { cb() } catch {} })
}

// 启动全局轮询（只启动一次，自动清理）
export function startSync(delayMs = 3000) {
  if (syncTimer) return // 已启动
  syncTimer = setInterval(async () => {
    await fetchSharedState()
    notifyCallbacks()
  }, delayMs)
  // 立即拉一次
  fetchSharedState().then(notifyCallbacks)
}
