import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { CaretLeft, User, PencilSimple, Trash, Calendar, BookOpen, TShirt, Plus, Minus } from '@phosphor-icons/react'
import DiaryCard from '../components/DiaryCard'
import { getMemberImage } from '../memberImages'
import { ACCESSORY_CATS, CAT_NAMES, loadOutfit, saveOutfit } from '../outfitUtils'

const CHAR_W = 140
const CHAR_H = 190

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
  const [activeCat, setActiveCat] = useState(CAT_NAMES[0])
  const [outfit, setOutfit] = useState([])
  const outfitRef = useRef([])
  const [selIdx, setSelIdx] = useState(null)
  const selIdxRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const charRef = useRef(null)
  const dragOffRef = useRef({ x: 0, y: 0 })

  const isLocalId = typeof id === 'string' && id.startsWith('local-')
  const localName = isLocalId ? id.replace('local-', '') : null

  useEffect(() => { outfitRef.current = outfit }, [outfit])
  useEffect(() => { selIdxRef.current = selIdx }, [selIdx])

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

  // --- 换装编辑器 ---

  const handleAddAccessory = (emoji) => {
    const item = { e: emoji, x: 50, y: 20, s: 1, r: 0 }
    const next = [...outfit, item]
    setOutfit(next)
    saveOutfit(member.name, next)
    setSelIdx(next.length - 1)
  }

  const handleRemoveSelected = () => {
    if (selIdx == null) return
    const next = outfit.filter((_, i) => i !== selIdx)
    setOutfit(next)
    saveOutfit(member.name, next)
    setSelIdx(null)
  }

  const handleScale = (delta) => {
    if (selIdx == null) return
    const next = outfit.map((item, i) => {
      if (i !== selIdx) return item
      const s = Math.max(0.3, Math.min(3, item.s + delta))
      return { ...item, s: Math.round(s * 10) / 10 }
    })
    setOutfit(next)
    saveOutfit(member.name, next)
  }

  const handleRotate = (delta) => {
    if (selIdx == null) return
    const next = outfit.map((item, i) => {
      if (i !== selIdx) return item
      const r = item.r + delta
      return { ...item, r: Math.round(r) }
    })
    setOutfit(next)
    saveOutfit(member.name, next)
  }

  const handlePointerDownItem = (e, idx) => {
    e.stopPropagation()
    e.preventDefault()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    setSelIdx(idx)
    selIdxRef.current = idx
    setDragging(true)
    const rect = charRef.current.getBoundingClientRect()
    const item = outfitRef.current[idx]
    dragOffRef.current = {
      x: e.clientX - rect.left - (item.x / 100) * rect.width,
      y: e.clientY - rect.top - (item.y / 100) * rect.height,
    }
  }

  const handlePointerMoveItem = (e) => {
    const idx = selIdxRef.current
    if (idx == null) return
    e.preventDefault()
    const rect = charRef.current.getBoundingClientRect()
    const px = e.clientX - dragOffRef.current.x
    const py = e.clientY - dragOffRef.current.y
    const x = Math.round(Math.max(0, Math.min(100, (px / rect.width) * 100)))
    const y = Math.round(Math.max(0, Math.min(100, (py / rect.height) * 100)))
    const next = outfitRef.current.map((item, i) => {
      if (i !== idx) return item
      return { ...item, x, y }
    })
    outfitRef.current = next
    setOutfit(next)
  }

  const handlePointerUpItem = (e) => {
    e.preventDefault()
    const el = e.currentTarget
    el.releasePointerCapture(e.pointerId)
    if (selIdxRef.current != null) {
      saveOutfit(member?.name, outfitRef.current)
    }
    setDragging(false)
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
  const selItem = selIdx != null ? outfit[selIdx] : null

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
        {/* 角色展示区 */}
        <div
          ref={charRef}
          style={{
            width: CHAR_W, height: CHAR_H,
            margin: '0 auto 12px',
            position: 'relative',
            overflow: 'hidden',
            touchAction: showDressUp ? 'none' : undefined,
          }}
        >
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
                pointerEvents: 'none',
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

          {/* 配饰渲染 */}
          {outfit.map((item, i) => {
            const x = item.x != null ? item.x : 50
            const y = item.y != null ? item.y : 20
            const s = item.s != null ? item.s : 1
            const r = item.r != null ? item.r : 0
            const isSel = selIdx === i && showDressUp

            return (
              <div
                key={i}
                onPointerDown={(e) => {
                  if (!showDressUp) return
                  handlePointerDownItem(e, i)
                }}
                onPointerMove={handlePointerMoveItem}
                onPointerUp={handlePointerUpItem}
                onLostPointerCapture={handlePointerUpItem}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) scale(${s}) rotate(${r}deg)`,
                  fontSize: 28,
                  zIndex: isSel ? 5 : 2,
                  cursor: showDressUp ? 'grab' : undefined,
                  pointerEvents: showDressUp ? 'auto' : 'none',
                  filter: isSel ? 'drop-shadow(0 0 6px var(--color-brand-primary)) brightness(1.2)' : undefined,
                  userSelect: 'none',
                  touchAction: 'none',
                }}
              >
                {item.e}
              </div>
            )
          })}
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          {member.name}
        </h2>

        {/* 换装按钮 */}
        <button
          onClick={() => { setShowDressUp(!showDressUp); setSelIdx(null) }}
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

        {/* 换装编辑器 */}
        {showDressUp && (
          <div style={{
            background: 'var(--color-surface-primary)',
            borderRadius: 12, padding: 10, marginBottom: 10,
            border: '1px solid var(--color-brand-subtle)',
          }}>
            {/* 选中配饰控制栏 */}
            {selItem && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, marginBottom: 10, flexWrap: 'wrap',
                padding: '6px 8px', background: 'var(--color-surface-card)',
                borderRadius: 10, fontSize: 13,
              }}>
                <span style={{ fontSize: 20 }}>{selItem.e}</span>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  x:{selItem.x}% y:{selItem.y}%
                </span>
                <button onClick={() => handleScale(-0.1)} style={ctrlBtnStyle} title="缩小"><Minus size={12} /></button>
                <span style={{ fontSize: 12, minWidth: 32, textAlign: 'center' }}>{selItem.s}x</span>
                <button onClick={() => handleScale(0.1)} style={ctrlBtnStyle} title="放大"><Plus size={12} /></button>
                <button onClick={() => handleRotate(-15)} style={ctrlBtnStyle} title="左转">↺</button>
                <span style={{ fontSize: 12, minWidth: 32, textAlign: 'center' }}>{selItem.r}°</span>
                <button onClick={() => handleRotate(15)} style={ctrlBtnStyle} title="右转">↻</button>
                <button onClick={handleRemoveSelected} style={{ ...ctrlBtnStyle, color: '#E74C3C', borderColor: '#E74C3C' }}>删除</button>
              </div>
            )}

            {selItem == null && (
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                点击角色身上的配饰可拖动调整位置，下方选择新配饰添加
              </p>
            )}

            {/* 分类标签 */}
            <div style={{
              display: 'flex', gap: 3, marginBottom: 8,
              flexWrap: 'wrap', justifyContent: 'center',
            }}>
              {CAT_NAMES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  style={{
                    fontSize: 11, padding: '3px 8px',
                    borderRadius: 10, border: 'none',
                    background: activeCat === cat ? 'var(--color-brand-primary)' : 'var(--color-surface-card)',
                    color: activeCat === cat ? '#fff' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 配饰选择器 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 4,
            }}>
              {ACCESSORY_CATS[activeCat].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleAddAccessory(emoji)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 10,
                    border: '1px solid var(--color-brand-subtle)',
                    background: 'var(--color-surface-card)',
                    cursor: 'pointer',
                    fontSize: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {emoji}
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
            <input id="edit-member-name" className="input" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="姓名" style={{ marginBottom: 8, textAlign: 'center', fontSize: 15, fontWeight: 600 }} />
            <label htmlFor="edit-member-bio" className="sr-only">自我介绍</label>
            <textarea id="edit-member-bio" className="input" value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="写一段自我介绍..." style={{ marginBottom: 10, minHeight: 80, textAlign: 'left' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn-primary" onClick={handleSaveBio} disabled={saving} style={{ fontSize: 13, padding: '6px 18px' }}>{saving ? '保存中...' : '保存'}</button>
              <button className="btn-outline" onClick={() => { setEditing(false); setEditBio(member.bio || ''); setEditName(member.name) }} style={{ fontSize: 13, padding: '6px 18px' }}>取消</button>
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
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-brand-subtle)', fontSize: 13 }}>
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
            onEdit={async (dId, newText) => { await supabase.from('diaries').update({ content_text: newText }).eq('id', dId); fetchMember() }}
            onDelete={async (dId) => { await supabase.from('diaries').delete().eq('id', dId); fetchMember() }}
          />
        ))
      )}
    </div>
  )
}

const ctrlBtnStyle = {
  width: 28, height: 28, borderRadius: 6,
  border: '1px solid var(--color-brand-subtle)',
  background: 'var(--color-surface-primary)',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 11,
  color: 'var(--color-text-primary)',
}
