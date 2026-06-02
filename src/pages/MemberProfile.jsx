import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { CaretLeft, User, PencilSimple, Trash, Calendar, BookOpen, TShirt, Plus, Minus } from '@phosphor-icons/react'
import DiaryCard from '../components/DiaryCard'
import ErrorBoundary from '../components/ErrorBoundary'
import { getMemberImage } from '../memberImages'
import { ACCESSORY_CATS, CAT_NAMES, loadOutfit, saveOutfit, ACC_FONT_RATIO } from '../outfitUtils'

const CHAR_W = 140
const CHAR_H = 190

export default function MemberProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [courses, setCourses] = useState([])
  const [diaries, setDiaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editBio, setEditBio] = useState('')
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDressUp, setShowDressUp] = useState(false)
  const [activeCat, setActiveCat] = useState(CAT_NAMES[0])
  const [outfit, setOutfit] = useState([])

  // 选中索引 – 仅在非拖动时使用，拖动期间用ref
  const [selIdx, setSelIdx] = useState(null)

  // ---- 拖动专用 refs（拖动期间完全不走React state，避免重渲染覆盖DOM） ----
  const charRef = useRef(null)
  const outfitRef = useRef([])       // outfit 快照
  const selRef = useRef(null)        // 当前选中索引
  const dragIdx = useRef(null)       // 正在拖动的索引
  const dragEl = useRef(null)        // 正在拖动的DOM元素
  const dragOff = useRef({ x: 0, y: 0 })
  const prevSelEl = useRef(null)     // 上次高亮的DOM元素

  useEffect(() => { outfitRef.current = outfit }, [outfit])

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
    try {
      const { data } = await supabase.from('members').select('*').eq('id', id).single()
      if (data) {
        setMember(data)
        setOutfit(loadOutfit(data.name))
        setEditBio(data.bio || '')
        try {
          const { data: cd } = await supabase.from('courses').select('*, classes(name)')
            .eq('teacher_name', data.name).order('course_date', { ascending: true })
          if (cd) setCourses(cd)
        } catch {}
        try {
          const { data: dd } = await supabase.from('diaries').select('*')
            .eq('author_name', data.name).order('created_at', { ascending: false })
          if (dd) setDiaries(dd)
        } catch {}
      }
    } catch {
      setError(true)
    }
    setLoading(false)
  }

  const persist = (items) => {
    outfitRef.current = items
    saveOutfit(member?.name, items)
    setOutfit(items)
  }

  // ---- 高亮DOM（纯DOM操作，不走React） ----
  const highlightEl = (el) => {
    if (prevSelEl.current && prevSelEl.current !== el) {
      prevSelEl.current.style.filter = ''
      prevSelEl.current.style.zIndex = '2'
    }
    if (el) {
      el.style.filter = 'drop-shadow(0 0 6px var(--color-brand-primary)) brightness(1.2)'
      el.style.zIndex = '5'
    }
    prevSelEl.current = el
  }

  const clearHighlight = () => {
    if (prevSelEl.current) {
      prevSelEl.current.style.filter = ''
      prevSelEl.current.style.zIndex = '2'
      prevSelEl.current = null
    }
  }

  // ---- 配件操作 ----
  const handleAddAccessory = (emoji) => {
    const item = { e: emoji, x: 50, y: 20, s: 1, r: 0, o: 1 }
    const next = [...outfit, item]
    persist(next)
    setSelIdx(next.length - 1)
  }

  const handleRemoveSelected = () => {
    if (selIdx == null) return
    clearHighlight()
    const next = outfit.filter((_, i) => i !== selIdx)
    persist(next)
    setSelIdx(null)
  }

  const handleScale = (d) => { if (selIdx == null) return; const n = outfitRef.current.map((item,i) => i!==selIdx? item : {...item, s:Math.round(Math.max(0.3,Math.min(3,item.s+d))*10)/10}); persist(n) }
  const handleRotate = (d) => { if (selIdx == null) return; const n = outfitRef.current.map((item,i) => i!==selIdx? item : {...item, r:Math.round((item.r+d)%360)}); persist(n) }
  const handleOpacity = (d) => { if (selIdx == null) return; const n = outfitRef.current.map((item,i) => i!==selIdx? item : {...item, o:Math.round(Math.max(0,Math.min(1,(item.o||1)+d))*10)/10}); persist(n) }
  const handleClipB = (d) => { if (selIdx == null) return; const n = outfitRef.current.map((item,i) => i!==selIdx? item : {...item, b:Math.round(Math.max(0,Math.min(90,(item.b||0)+d))*10)/10}); persist(n) }

  // ---- 拖动系统（window级事件，纯ref，零React重渲染） ----
  const onPointerDown = useCallback((e) => {
    const el = e.target.closest('[data-acc]')
    if (!el) {
      // 点击空白 – 取消选中
      clearHighlight()
      setSelIdx(null)
      selRef.current = null
      return
    }
    e.preventDefault()
    const idx = Number(el.dataset.acc)
    selRef.current = idx
    setSelIdx(idx)
    highlightEl(el)

    // 开始拖动
    dragIdx.current = idx
    dragEl.current = el
    el.setPointerCapture(e.pointerId)
    el.style.cursor = 'grabbing'

    const rect = charRef.current.getBoundingClientRect()
    const item = outfitRef.current[idx]
    dragOff.current = {
      x: e.clientX - rect.left - (item.x / 100) * rect.width,
      y: e.clientY - rect.top - (item.y / 100) * rect.height,
    }
  }, [])

  const onPointerMove = useCallback((e) => {
    if (dragIdx.current == null) return
    e.preventDefault()
    const rect = charRef.current.getBoundingClientRect()
    const px = e.clientX - dragOff.current.x
    const py = e.clientY - dragOff.current.y
    const x = Math.round(Math.max(0, Math.min(100, (px / rect.width) * 100)))
    const y = Math.round(Math.max(0, Math.min(100, (py / rect.height) * 100)))

    // 直接改DOM
    if (dragEl.current) {
      dragEl.current.style.left = `${x}%`
      dragEl.current.style.top = `${y}%`
    }

    // 同步更新ref
    outfitRef.current = outfitRef.current.map((item, i) => {
      if (i !== dragIdx.current) return item
      return { ...item, x, y }
    })
  }, [])

  const onPointerUp = useCallback((e) => {
    if (dragIdx.current == null) return
    e.preventDefault()
    if (dragEl.current) {
      dragEl.current.releasePointerCapture(e.pointerId)
      dragEl.current.style.cursor = 'grab'
    }
    // 提交到React state（仅此一次）
    const final = outfitRef.current
    saveOutfit(member?.name, final)
    setOutfit([...final])
    dragIdx.current = null
    dragEl.current = null
  }, [member])

  // 当outfit变化时清除高亮（可能删除了元素）
  useEffect(() => {
    if (selIdx != null && selIdx >= outfit.length) {
      clearHighlight()
      setSelIdx(null)
      selRef.current = null
    }
  }, [outfit, selIdx])

  if (loading) return <div className="page-content" style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>加载中...</div>
  if (!member) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: 60 }}>
        {error ? (
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 12 }}>数据库暂不可用</p>
            <button className="btn-outline" onClick={() => navigate('/')} style={{ fontSize: 13, padding: '6px 18px' }}>返回首页</button>
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>成员不存在</p>
        )}
      </div>
    )
  }

  const avatarSrc = getMemberImage(member.name) || member.avatar_url
  const editorFont = Math.round(CHAR_W * ACC_FONT_RATIO)
  const selItem = selIdx != null ? outfit[selIdx] : null

  return (
    <div className="page-content">
      <button onClick={() => navigate('/')} aria-label="返回首页" style={{ background:'none',border:'none',cursor:'pointer',fontSize:14,color:'var(--color-brand-emphasis)',marginBottom:12,padding:0,display:'flex',alignItems:'center',gap:4 }}>
        <CaretLeft size={16} /> 返回首页
      </button>

      <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
        {/* 角色展示区 */}
        <div
          ref={charRef}
          onPointerDown={showDressUp ? onPointerDown : undefined}
          onPointerMove={showDressUp ? onPointerMove : undefined}
          onPointerUp={showDressUp ? onPointerUp : undefined}
          onLostPointerCapture={showDressUp ? onPointerUp : undefined}
          style={{
            width: CHAR_W, height: CHAR_H, margin: '0 auto 12px',
            position: 'relative', overflow: 'hidden',
            touchAction: showDressUp ? 'none' : undefined,
            userSelect: 'none',
          }}
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt={member.name} draggable={false} style={{
              width:'100%',height:'100%',objectFit:'contain',objectPosition:'bottom center',
              position:'relative',zIndex:1,pointerEvents:'none',
            }} />
          ) : (
            <div style={{ width:64,height:64,borderRadius:'50%',position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'linear-gradient(135deg,var(--color-brand-primary),var(--color-brand-subtle))',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1 }}>
              <User size={32} color="#FFF" />
            </div>
          )}

          {/* 配饰 */}
          {outfit.map((item, i) => {
            const x = item.x ?? 50
            const y = item.y ?? 20
            const s = item.s ?? 1
            const r = item.r ?? 0
            const o = item.o ?? 1
            const b = item.b ?? 0  // clip from bottom %

            return (
              <div
                key={i}
                data-acc={i}
                style={{
                  position: 'absolute', left: `${x}%`, top: `${y}%`,
                  transform: `translate(-50%, -50%) scale(${s}) rotate(${r}deg)`,
                  fontSize: editorFont, zIndex: 2, opacity: o,
                  cursor: showDressUp ? 'grab' : undefined,
                  pointerEvents: showDressUp ? 'auto' : 'none',
                  userSelect: 'none', touchAction: 'none',
                  clipPath: b > 0 ? `inset(0 0 ${b}% 0)` : undefined,
                  overflow: 'hidden',
                }}
              >
                {item.e}
              </div>
            )
          })}
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{member.name}</h2>

        {/* 换装按钮 */}
        <button onClick={() => { setShowDressUp(!showDressUp); setSelIdx(null); selRef.current=null; clearHighlight() }}
          style={{ fontSize:13,padding:'6px 16px',marginBottom:10,border:'1px solid var(--color-brand-primary)',borderRadius:16,background:showDressUp?'var(--color-brand-primary)':'transparent',color:showDressUp?'#fff':'var(--color-brand-primary)',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6 }}>
          <TShirt size={16} /> {showDressUp ? '收起换装' : '换装'}
        </button>

        {/* 换装编辑器 */}
        {showDressUp && (
          <div style={{ background:'var(--color-surface-primary)',borderRadius:12,padding:10,marginBottom:10,border:'1px solid var(--color-brand-subtle)' }}>
            {selItem && (
              <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:4,marginBottom:10,flexWrap:'wrap',padding:'6px 8px',background:'var(--color-surface-card)',borderRadius:10,fontSize:12 }}>
                <span style={{ fontSize:20 }}>{selItem.e}</span>
                <span style={{ fontSize:10,color:'var(--color-text-secondary)' }}>x:{selItem.x}% y:{selItem.y}%</span>

                <button onClick={()=>handleScale(-0.1)} style={cs.btn}><Minus size={12}/></button>
                <span style={cs.val}>{selItem.s}x</span>
                <button onClick={()=>handleScale(0.1)} style={cs.btn}><Plus size={12}/></button>

                <button onClick={()=>handleRotate(-15)} style={cs.btn}>↺</button>
                <span style={cs.val}>{selItem.r}°</span>
                <button onClick={()=>handleRotate(15)} style={cs.btn}>↻</button>

                <span style={{ fontSize:10,color:'var(--color-text-secondary)',marginLeft:4 }}>透明</span>
                <button onClick={()=>handleOpacity(-0.1)} style={cs.btn}><Minus size={10}/></button>
                <span style={cs.val}>{Math.round((selItem.o||1)*100)}%</span>
                <button onClick={()=>handleOpacity(0.1)} style={cs.btn}><Plus size={10}/></button>

                <span style={{ fontSize:10,color:'var(--color-text-secondary)',marginLeft:4 }}>擦底</span>
                <button onClick={()=>handleClipB(-5)} style={cs.btn}><Minus size={10}/></button>
                <span style={cs.val}>{Math.round(selItem.b||0)}%</span>
                <button onClick={()=>handleClipB(5)} style={cs.btn}><Plus size={10}/></button>

                <button onClick={handleRemoveSelected} style={{ ...cs.btn,color:'#E74C3C',borderColor:'#E74C3C',marginLeft:8 }}>删除</button>
              </div>
            )}

            {selItem == null && (
              <p style={{ fontSize:11,color:'var(--color-text-secondary)',marginBottom:8 }}>
                点击下方添加配饰 → 拖动角色身上配饰移动 → 点空白取消选中
              </p>
            )}

            {/* 分类标签 */}
            <div style={{ display:'flex',gap:3,marginBottom:8,flexWrap:'wrap',justifyContent:'center' }}>
              {CAT_NAMES.map(cat => (
                <button key={cat} onClick={()=>setActiveCat(cat)} style={{ fontSize:11,padding:'3px 8px',borderRadius:10,border:'none',background:activeCat===cat?'var(--color-brand-primary)':'var(--color-surface-card)',color:activeCat===cat?'#fff':'var(--color-text-secondary)',cursor:'pointer' }}>{cat}</button>
              ))}
            </div>

            <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4 }}>
              {ACCESSORY_CATS[activeCat].map(emoji => (
                <button key={emoji} onClick={()=>handleAddAccessory(emoji)} style={{ aspectRatio:'1',borderRadius:10,border:'1px solid var(--color-brand-subtle)',background:'var(--color-surface-card)',cursor:'pointer',fontSize:22,display:'flex',alignItems:'center',justifyContent:'center' }}>{emoji}</button>
              ))}
            </div>
          </div>
        )}

        {isLocalId ? (
          <p style={{ fontSize:14,color:'var(--color-text-secondary)',lineHeight:1.7,marginBottom:10 }}>暂未收录到数据库</p>
        ) : editing ? (
          <div>
            <input className="input" value={editName} onChange={e=>setEditName(e.target.value)} placeholder="姓名" style={{ marginBottom:8,textAlign:'center',fontSize:15,fontWeight:600 }} />
            <textarea className="input" value={editBio} onChange={e=>setEditBio(e.target.value)} placeholder="写一段自我介绍..." style={{ marginBottom:10,minHeight:80,textAlign:'left' }} />
            <div style={{ display:'flex',gap:8,justifyContent:'center' }}>
              <button className="btn-primary" onClick={handleSaveBio} disabled={saving} style={{ fontSize:13,padding:'6px 18px' }}>{saving?'保存中...':'保存'}</button>
              <button className="btn-outline" onClick={()=>{setEditing(false);setEditBio(member.bio||'');setEditName(member.name)}} style={{ fontSize:13,padding:'6px 18px' }}>取消</button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize:14,color:member.bio?'var(--color-text-primary)':'var(--color-text-secondary)',lineHeight:1.7,marginBottom:10 }}>{member.bio||'ta还没有填写自我介绍'}</p>
            <div style={{ display:'flex',gap:8,justifyContent:'center' }}>
              <button className="btn-outline" onClick={()=>{setEditing(true);setEditBio(member.bio||'');setEditName(member.name)}} style={{ fontSize:12,padding:'4px 14px',display:'flex',alignItems:'center',gap:4 }}><PencilSimple size={14}/> 编辑</button>
              <button className="btn-danger" onClick={handleDeleteMember} style={{ fontSize:12,padding:'4px 14px',display:'flex',alignItems:'center',gap:4 }}><Trash size={14}/> 删除</button>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom:16 }}>
        <h3 style={{ fontSize:15,fontWeight:600,marginBottom:10,display:'flex',alignItems:'center',gap:6 }}>
          <Calendar size={18} weight="fill" style={{ color:'var(--color-brand-primary)' }}/> {member.name}的课程 ({courses.length}节)
        </h3>
        {courses.length===0 ? <p style={{ color:'var(--color-text-secondary)',fontSize:13 }}>暂未排课</p> : (
          <div style={{ maxHeight:200,overflowY:'auto' }}>
            {courses.map(c => (
              <div key={c.id} style={{ display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--color-brand-subtle)',fontSize:13 }}>
                <span>{c.course_date}</span><span style={{ fontWeight:500 }}>{c.course_name}</span><span style={{ color:'var(--color-text-secondary)',fontSize:12 }}>{c.classes?.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <h3 style={{ fontSize:15,fontWeight:600,marginBottom:10,display:'flex',alignItems:'center',gap:6 }}>
        <BookOpen size={18} weight="fill" style={{ color:'var(--color-brand-primary)' }}/> {member.name}的日记 ({diaries.length}篇)
      </h3>
      {diaries.length===0 ? (
        <div className="card" style={{ textAlign:'center',padding:24 }}><p style={{ color:'var(--color-text-secondary)',fontSize:13 }}>ta还没有写过日记</p></div>
      ) : (
        diaries.map(diary => (
          <DiaryCard key={diary.id} diary={diary}
            onEdit={async(dId,newText)=>{await supabase.from('diaries').update({content_text:newText}).eq('id',dId);fetchMember()}}
            onDelete={async(dId)=>{await supabase.from('diaries').delete().eq('id',dId);fetchMember()}}/>
        ))
      )}
    </div>
  )
}

const cs = {
  btn: { width:26,height:26,borderRadius:6,border:'1px solid var(--color-brand-subtle)',background:'var(--color-surface-primary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'var(--color-text-primary)' },
  val: { fontSize:11,minWidth:30,textAlign:'center',color:'var(--color-text-secondary)' },
}
