import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { CaretLeft, User, PencilSimple, Trash, Calendar, BookOpen, TShirt } from '@phosphor-icons/react'
import DiaryCard from '../components/DiaryCard'
import { getMemberImage } from '../memberImages'

const ACCESSORIES = {
  head: { label: '头饰', items: [
    { e: '', n: '无' },
    { e: '👑', n: '皇冠' },
    { e: '🎓', n: '学士帽' },
    { e: '🎩', n: '礼帽' },
    { e: '🤠', n: '牛仔帽' },
    { e: '🎀', n: '蝴蝶结' },
    { e: '🌸', n: '花朵' },
    { e: '⭐', n: '星星' },
    { e: '🐰', n: '兔耳' },
    { e: '🐱', n: '猫耳' },
    { e: '🎧', n: '耳机' },
  ]},
  eyes: { label: '眼镜', items: [
    { e: '', n: '无' },
    { e: '👓', n: '圆框镜' },
    { e: '🕶️', n: '墨镜' },
    { e: '🤓', n: '学霸镜' },
    { e: '🥽', n: '护目镜' },
  ]},
  face: { label: '面部', items: [
    { e: '', n: '无' },
    { e: '😷', n: '口罩' },
    { e: '🤡', n: '红鼻' },
    { e: '💋', n: '红唇' },
    { e: '😊', n: '微笑' },
  ]},
  neck: { label: '颈部', items: [
    { e: '', n: '无' },
    { e: '🧣', n: '围巾' },
    { e: '👔', n: '领带' },
    { e: '🎗️', n: '丝带' },
    { e: '💎', n: '钻石链' },
  ]},
  hand: { label: '手持', items: [
    { e: '', n: '无' },
    { e: '🌸', n: '花束' },
    { e: '⭐', n: '魔法棒' },
    { e: '🎤', n: '话筒' },
    { e: '📚', n: '书本' },
    { e: '⚽', n: '足球' },
    { e: '🎸', n: '吉他' },
    { e: '🔮', n: '水晶球' },
    { e: '💐', n: '鲜花' },
    { e: '🏀', n: '篮球' },
  ]},
  bg: { label: '背景', items: [
    { e: '', n: '无' },
    { e: '✨', n: '闪闪' },
    { e: '💫', n: '星光' },
    { e: '🌈', n: '彩虹' },
    { e: '💖', n: '爱心' },
    { e: '🔥', n: '火焰' },
    { e: '🎵', n: '音符' },
    { e: '🌺', n: '花朵' },
  ]},
}

const CATEGORIES = Object.keys(ACCESSORIES)

const DEFAULT_OUTFIT = { head: 0, eyes: 0, face: 0, neck: 0, hand: 0, bg: 0 }

function loadOutfit(name) {
  try {
    const saved = JSON.parse(localStorage.getItem(`rongyu_outfit_${name}`))
    if (saved) return saved
  } catch {}
  return { ...DEFAULT_OUTFIT }
}

function saveOutfit(name, outfit) {
  try { localStorage.setItem(`rongyu_outfit_${name}`, JSON.stringify(outfit)) } catch {}
}

export default function MemberProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [courses, setCourses] = useState([])
  const [diaries, setDiaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editBio, setEditBio] = useState('')
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDressUp, setShowDressUp] = useState(false)
  const [outfit, setOutfit] = useState(DEFAULT_OUTFIT)
  const [activeCat, setActiveCat] = useState('head')

  const isLocalId = typeof id === 'string' && id.startsWith('local-')
  const localName = isLocalId ? id.replace('local-', '') : null

  useEffect(() => {
    if (isLocalId) {
      setMember({ id, name: localName, bio: '', avatar_url: null })
      setOutfit(loadOutfit(localName))
      setLoading(false)
      return
    }
    fetchMember()
  }, [id])

  const fetchMember = async () => {
    const { data } = await supabase.from('members').select('*').eq('id', id).single()
    if (data) {
      setMember(data)
      setOutfit(loadOutfit(data.name))
      setEditBio(data.bio || '')

      const { data: courseData } = await supabase
        .from('courses')
        .select('*, classes(name)')
        .eq('teacher_name', data.name)
        .order('course_date', { ascending: true })
      if (courseData) setCourses(courseData)

      const { data: diaryData } = await supabase
        .from('diaries')
        .select('*')
        .eq('author_name', data.name)
        .order('created_at', { ascending: false })
      if (diaryData) setDiaries(diaryData)
    }
    setLoading(false)
  }

  const handleSaveBio = async () => {
    if (!editName.trim()) return
    setSaving(true)
    await supabase.from('members').update({ name: editName.trim(), bio: editBio.trim() }).eq('id', id)
    setMember({ ...member, name: editName.trim(), bio: editBio.trim() })
    setEditing(false)
    setSaving(false)
  }

  const handleDeleteMember = async () => {
    if (!confirm('确定删除该成员吗？ta的课程和日记不会被删除。')) return
    await supabase.from('members').delete().eq('id', id)
    navigate('/')
  }

  const handleSelectAccessory = (cat, idx) => {
    const next = { ...outfit, [cat]: idx }
    setOutfit(next)
    saveOutfit(member.name, next)
  }

  if (loading) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>
        加载中...
      </div>
    )
  }

  if (!member) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>
        成员不存在
      </div>
    )
  }

  const avatarSrc = getMemberImage(member.name) || member.avatar_url
  const charW = 120
  const charH = 160

  return (
    <div className="page-content">
      <button
        onClick={() => navigate('/')}
        aria-label="返回首页"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 14, color: 'var(--color-brand-emphasis)', marginBottom: 12, padding: 0,
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        <CaretLeft size={16} /> 返回首页
      </button>

      <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
        {/* 角色展示 */}
        <div style={{
          width: charW, height: charH,
          margin: '0 auto 12px',
          position: 'relative',
          overflow: 'visible',
        }}>
          {/* 背景特效 */}
          {(outfit.bg > 0 && ACCESSORIES.bg.items[outfit.bg].e) && (
            <div style={{
              position: 'absolute', inset: -20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, opacity: 0.5, pointerEvents: 'none',
              animation: 'pulse 2s ease-in-out infinite',
            }}>
              {ACCESSORIES.bg.items[outfit.bg].e.repeat(3)}
            </div>
          )}

          {/* 身体 */}
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={member.name}
              style={{
                width: '100%', height: '100%',
                objectFit: 'contain',
                objectPosition: 'bottom center',
                position: 'relative', zIndex: 1,
              }}
            />
          ) : (
            <div style={{
              width: 64, height: 64, borderRadius: '50%', position: 'absolute',
              top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-subtle))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
            }}>
              <User size={32} color="#FFF" />
            </div>
          )}

          {/* 头饰 - top */}
          {(outfit.head > 0 && ACCESSORIES.head.items[outfit.head].e) && (
            <div style={{
              position: 'absolute', top: -8, left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 28, zIndex: 3, pointerEvents: 'none',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
            }}>
              {ACCESSORIES.head.items[outfit.head].e}
            </div>
          )}

          {/* 眼镜 - face area */}
          {(outfit.eyes > 0 && ACCESSORIES.eyes.items[outfit.eyes].e) && (
            <div style={{
              position: 'absolute', top: '22%', left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 24, zIndex: 3, pointerEvents: 'none',
            }}>
              {ACCESSORIES.eyes.items[outfit.eyes].e}
            </div>
          )}

          {/* 面部 */}
          {(outfit.face > 0 && ACCESSORIES.face.items[outfit.face].e) && (
            <div style={{
              position: 'absolute', top: '28%', left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 22, zIndex: 3, pointerEvents: 'none',
            }}>
              {ACCESSORIES.face.items[outfit.face].e}
            </div>
          )}

          {/* 颈部 */}
          {(outfit.neck > 0 && ACCESSORIES.neck.items[outfit.neck].e) && (
            <div style={{
              position: 'absolute', top: '38%', left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 20, zIndex: 3, pointerEvents: 'none',
            }}>
              {ACCESSORIES.neck.items[outfit.neck].e}
            </div>
          )}

          {/* 手持 */}
          {(outfit.hand > 0 && ACCESSORIES.hand.items[outfit.hand].e) && (
            <div style={{
              position: 'absolute', top: '58%', left: '62%',
              fontSize: 24, zIndex: 3, pointerEvents: 'none',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
            }}>
              {ACCESSORIES.hand.items[outfit.hand].e}
            </div>
          )}
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          {member.name}
        </h2>

        {/* 换装按钮 */}
        <button
          onClick={() => setShowDressUp(!showDressUp)}
          style={{
            fontSize: 13, padding: '6px 16px', marginBottom: 10,
            border: '1px solid var(--color-brand-primary)',
            borderRadius: 16, background: showDressUp ? 'var(--color-brand-primary)' : 'transparent',
            color: showDressUp ? '#fff' : 'var(--color-brand-primary)',
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <TShirt size={16} />
          {showDressUp ? '收起换装' : '换装'}
        </button>

        {/* 换装面板 */}
        {showDressUp && (
          <div style={{
            background: 'var(--color-surface-primary)',
            borderRadius: 12, padding: 12, marginBottom: 10,
            border: '1px solid var(--color-brand-subtle)',
          }}>
            {/* 分类标签 */}
            <div style={{
              display: 'flex', gap: 4, marginBottom: 10,
              flexWrap: 'wrap', justifyContent: 'center',
            }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  style={{
                    fontSize: 12, padding: '4px 10px',
                    borderRadius: 12, border: 'none',
                    background: activeCat === cat ? 'var(--color-brand-primary)' : 'var(--color-surface-card)',
                    color: activeCat === cat ? '#fff' : 'var(--color-text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  {ACCESSORIES[cat].label}
                  {outfit[cat] > 0 && (
                    <span style={{ marginLeft: 4, fontSize: 10 }}>●</span>
                  )}
                </button>
              ))}
            </div>

            {/* 选项网格 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 6,
            }}>
              {ACCESSORIES[activeCat].items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectAccessory(activeCat, idx)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 10,
                    border: outfit[activeCat] === idx
                      ? '2px solid var(--color-brand-primary)'
                      : '1px solid var(--color-brand-subtle)',
                    background: outfit[activeCat] === idx
                      ? 'var(--color-brand-subtle)'
                      : 'var(--color-surface-card)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: item.e ? 24 : 12,
                    color: item.e ? undefined : 'var(--color-text-secondary)',
                  }}
                >
                  {item.e || '✕'}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLocalId ? (
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 10 }}>
            暂未收录到数据库
          </p>
        ) : editing ? (
          <div>
            <label htmlFor="edit-member-name" className="sr-only">姓名</label>
            <input
              id="edit-member-name"
              className="input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="姓名"
              style={{ marginBottom: 8, textAlign: 'center', fontSize: 15, fontWeight: 600 }}
            />
            <label htmlFor="edit-member-bio" className="sr-only">自我介绍</label>
            <textarea
              id="edit-member-bio"
              className="input"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="写一段自我介绍..."
              style={{ marginBottom: 10, minHeight: 80, textAlign: 'left' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn-primary" onClick={handleSaveBio} disabled={saving} style={{ fontSize: 13, padding: '6px 18px' }}>
                {saving ? '保存中...' : '保存'}
              </button>
              <button className="btn-outline" onClick={() => { setEditing(false); setEditBio(member.bio || ''); setEditName(member.name) }} style={{ fontSize: 13, padding: '6px 18px' }}>
                取消
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 14, color: member.bio ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 10 }}>
              {member.bio || 'ta还没有填写自我介绍'}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn-outline" onClick={() => { setEditing(true); setEditBio(member.bio || ''); setEditName(member.name) }} style={{ fontSize: 12, padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <PencilSimple size={14} /> 编辑
              </button>
              <button className="btn-danger" onClick={handleDeleteMember} style={{ fontSize: 12, padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Trash size={14} /> 删除
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={18} weight="fill" style={{ color: 'var(--color-brand-primary)' }} />
          {member.name}的课程 ({courses.length}节)
        </h3>
        {courses.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>暂未排课</p>
        ) : (
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {courses.map((c) => (
              <div key={c.id} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', borderBottom: '1px solid var(--color-brand-subtle)',
                fontSize: 13,
              }}>
                <span>{c.course_date}</span>
                <span style={{ fontWeight: 500 }}>{c.course_name}</span>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{c.classes?.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <BookOpen size={18} weight="fill" style={{ color: 'var(--color-brand-primary)' }} />
        {member.name}的日记 ({diaries.length}篇)
      </h3>
      {diaries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>ta还没有写过日记</p>
        </div>
      ) : (
        diaries.map((diary) => (
          <DiaryCard
            key={diary.id}
            diary={diary}
            onEdit={async (id, newText) => {
              await supabase.from('diaries').update({ content_text: newText }).eq('id', id)
              fetchMember()
            }}
            onDelete={async (id) => {
              await supabase.from('diaries').delete().eq('id', id)
              fetchMember()
            }}
          />
        ))
      )}
    </div>
  )
}
