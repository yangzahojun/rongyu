import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { CaretLeft, User, PencilSimple, Trash, Calendar, BookOpen, TShirt, Plus, Minus } from '@phosphor-icons/react'
import DiaryCard from '../components/DiaryCard'
import { getMemberImage } from '../memberImages'
import { ACCESSORY_CATS, CAT_NAMES, loadOutfit, saveOutfit, ACC_FONT_RATIO, loadCanvasState, saveCanvasState, DEFAULT_MEMBER_SIZE } from '../outfitUtils'

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
  const [selIdx, setSelIdx] = useState(null)
  const [charZoom, setCharZoom] = useState(1)
  const charZoomRef = useRef(1)

  // Refs - 所有可变操作走ref，不走state（避免闭包和重渲染问题）
  const charRef = useRef(null)
  const outfitRef = useRef([])
  const selRef = useRef(null)
  const dragIdx = useRef(null)
  const dragEl = useRef(null)
  const dragOff = useRef({ x: 0, y: 0 })
  const prevSelEl = useRef(null)
  const memberRef = useRef(null)

  useEffect(() => { outfitRef.current = outfit }, [outfit])
  useEffect(() => { selRef.current = selIdx }, [selIdx])
  useEffect(() => { memberRef.current = member }, [member])
  useEffect(() => { charZoomRef.current = charZoom }, [charZoom])

  const isLocalId = typeof id === 'string' && id.startsWith('local-')
  const localName = isLocalId ? id.replace('local-', '') : null

  useEffect(() => {
    if (isLocalId) {
      setMember({ id, name: localName, bio: '', avatar_url: null })
      setOutfit(loadOutfit(localName))
      // 读取已保存的缩放
      const canvas = loadCanvasState()
      const savedSize = (canvas.sizes && canvas.sizes[localName]) || DEFAULT_MEMBER_SIZE
      const z = Math.round(savedSize / DEFAULT_MEMBER_SIZE * 10) / 10
      setCharZoom(z)
      charZoomRef.current = z
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
        // 读取已保存的人物缩放
        const canvas = loadCanvasState()
        const savedSize = (canvas.sizes && canvas.sizes[data.name]) || DEFAULT_MEMBER_SIZE
        const z = Math.round(savedSize / DEFAULT_MEMBER_SIZE * 10) / 10
        setCharZoom(z)
        charZoomRef.current = z
        setEditBio(data.bio || '')
        try { const r = await supabase.from('courses').select('*, classes(name)').eq('teacher_name', data.name).order('course_date', { ascending: true }); if (r.data) setCourses(r.data) } catch {}
        try { const r = await supabase.from('diaries').select('*').eq('author_name', data.name).order('created_at', { ascending: false }); if (r.data) setDiaries(r.data) } catch {}
      }
    } catch {}
    setLoading(false)
  }

  const handleSaveBio = async () => {
    if (!editName.trim()) return; setSaving(true)
    await supabase.from('members').update({ name: editName.trim(), bio: editBio.trim() }).eq('id', id)
    setMember({ ...member, name: editName.trim(), bio: editBio.trim() }); setEditing(false); setSaving(false)
  }

  const handleDeleteMember = async () => {
    if (!confirm('确定删除该成员吗？')) return
    await supabase.from('members').delete().eq('id', id); navigate('/')
  }

  // 人物缩放持久化 → 同步到canvasState.sizes → 首页实时体现
  const persistZoom = (z) => {
    const canvas = loadCanvasState()
    const sz = Math.round(DEFAULT_MEMBER_SIZE * z)
    const sizes = { ...(canvas.sizes || {}), [memberRef.current?.name || '']: sz }
    const positions = canvas.positions || {}
    saveCanvasState({ positions, sizes })
  }

  // --- 换装（全部用ref，state仅用于渲染触发） ---
  const persist = (items) => {
    outfitRef.current = items
    saveOutfit(memberRef.current?.name, items)
    setOutfit(items)
  }

  const handleAddAccessory = (emoji) => {
    const item = { e: emoji, x: 50, y: 20, s: 1, r: 0, o: 1 }
    const n = [...outfitRef.current, item]
    persist(n)
    setSelIdx(n.length - 1)
    selRef.current = n.length - 1
  }

  const handleRemoveSelected = () => {
    const idx = selRef.current
    if (idx == null) return
    clearHighlight()
    const n = outfitRef.current.filter((_, i) => i !== idx)
    persist(n)
    setSelIdx(null)
    selRef.current = null
  }

  // 通用修改选中配饰
  const modSel = (fn) => {
    const idx = selRef.current
    if (idx == null) return
    persist(outfitRef.current.map((it, i) => i !== idx ? it : fn(it)))
  }

  // --- 高亮 ---
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

  // --- 拖动（完全零state，零重渲染） ---
  // --- 拖动（window级事件，元素级pointerdown，零state重渲染） ---
  const onPointerDown = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const el = e.currentTarget
    const idx = Number(el.dataset.acc)

    selRef.current = idx
    dragIdx.current = idx
    dragEl.current = el
    el.setPointerCapture(e.pointerId)
    el.style.cursor = 'grabbing'
    highlightEl(el)

    const rect = charRef.current.getBoundingClientRect()
    const item = outfitRef.current[idx]
    dragOff.current = {
      x: e.clientX - rect.left - ((item.x ?? 50) / 100) * rect.width,
      y: e.clientY - rect.top - ((item.y ?? 20) / 100) * rect.height,
    }
  }, [])

  const onPointerMove = useCallback((e) => {
    if (dragIdx.current == null) return
    e.preventDefault()
    const el = e.currentTarget
    const rect = charRef.current.getBoundingClientRect()
    const x = Math.round(((e.clientX - dragOff.current.x) / rect.width) * 100)
    const y = Math.round(((e.clientY - dragOff.current.y) / rect.height) * 100)
    el.style.left = `${x}%`
    el.style.top = `${y}%`
    outfitRef.current = outfitRef.current.map((it, i) =>
      i !== dragIdx.current ? it : { ...it, x, y }
    )
  }, [])

  const onPointerUp = useCallback((e) => {
    const idx = dragIdx.current
    if (idx == null) return
    e.preventDefault()
    const el = e.currentTarget
    el.releasePointerCapture(e.pointerId)
    el.style.cursor = 'grab'
    saveOutfit(memberRef.current?.name, outfitRef.current)
    setOutfit([...outfitRef.current])
    setSelIdx(idx)
    dragIdx.current = null
    dragEl.current = null
  }, [])

  // 点击空白区域取消选中
  const onContainerClick = useCallback((e) => {
    if (e.target === charRef.current || e.target.tagName === 'IMG') {
      clearHighlight()
      setSelIdx(null)
      selRef.current = null
    }
  }, [])

  useEffect(() => {
    if (selIdx != null && selIdx >= outfit.length) {
      clearHighlight()
      setSelIdx(null)
      selRef.current = null
    }
  }, [outfit, selIdx])

  if (loading) {
    return <div className="page-content" style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>加载中...</div>
  }
  if (!member) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: 60 }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{isLocalId ? '成员不存在' : '加载失败，请返回重试'}</p>
        <button className="btn-outline" onClick={() => navigate('/')} style={{ fontSize: 13, padding: '6px 18px', marginTop: 12 }}>返回首页</button>
      </div>
    )
  }

  const avatarSrc = getMemberImage(member.name) || member.avatar_url
  const scaledW = CHAR_W * charZoom
  const scaledH = CHAR_H * charZoom
  const editorFont = Math.round(scaledW * ACC_FONT_RATIO)
  // selItem 使用 selIdx 和 outfit（都在同一个渲染周期内稳定）
  const localSelItem = selIdx != null ? outfit[selIdx] : null

  return (
    <div className="page-content">
      <button onClick={() => navigate('/')} aria-label="返回首页" style={{ background:'none',border:'none',cursor:'pointer',fontSize:14,color:'var(--color-brand-emphasis)',marginBottom:12,padding:0,display:'flex',alignItems:'center',gap:4 }}>
        <CaretLeft size={16} /> 返回首页
      </button>

      <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
        {/* 缩放控制 */}
        {showDressUp && (
          <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:8 }}>
            <span style={{ fontSize:11,color:'var(--color-text-secondary)' }}>人物缩放</span>
            <button onClick={()=>{ const z = Math.round(Math.max(0.5,Math.min(2,charZoomRef.current-0.1))*10)/10; setCharZoom(z); persistZoom(z) }} style={css.btn}><Minus size={12}/></button>
            <span style={{ fontSize:12,minWidth:36,textAlign:'center' }}>{Math.round(charZoom*100)}%</span>
            <button onClick={()=>{ const z = Math.round(Math.min(2,charZoomRef.current+0.1)*10)/10; setCharZoom(z); persistZoom(z) }} style={css.btn}><Plus size={12}/></button>
          </div>
        )}

        {/* 角色展示区 */}
        <div style={{ display:'flex',justifyContent:'center',marginBottom:12 }}>
          <div
            ref={charRef}
            onClick={showDressUp ? onContainerClick : undefined}
            style={{
              width: scaledW, height: scaledH,
              position: 'relative', overflow: 'visible',
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
            {outfit.map((item, i) => {
              const x = item.x ?? 50
              const y = item.y ?? 20
              const sv = item.s ?? 1
              const rv = item.r ?? 0
              const ov = item.o ?? 1
              const t = item.ct ?? 0
              const r = item.cr ?? 0
              const b = item.cb ?? 0
              const l = item.cl ?? 0
              const hasClip = t > 0 || r > 0 || b > 0 || l > 0
              return (
                <div
                  key={i} data-acc={i}
                  onPointerDown={showDressUp ? onPointerDown : undefined}
                  onPointerMove={showDressUp ? onPointerMove : undefined}
                  onPointerUp={showDressUp ? onPointerUp : undefined}
                  onLostPointerCapture={showDressUp ? onPointerUp : undefined}
                  style={{
                    position:'absolute', left:`${x}%`, top:`${y}%`,
                    transform:`translate(-50%,-50%) scale(${sv}) rotate(${rv}deg)`,
                    fontSize: editorFont, zIndex:2, opacity:ov,
                    cursor: showDressUp ? 'grab' : undefined,
                    pointerEvents: showDressUp ? 'auto' : 'none',
                    userSelect:'none', touchAction:'none',
                    clipPath: hasClip ? `inset(${t}% ${r}% ${b}% ${l}%)` : undefined,
                    overflow: hasClip ? 'hidden' : undefined,
                  }}>{item.e}</div>
              )
            })}
          </div>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{member.name}</h2>

        <button onClick={()=>{setShowDressUp(!showDressUp);setSelIdx(null);selRef.current=null;clearHighlight()}}
          style={{ fontSize:13,padding:'6px 16px',marginBottom:10,border:'1px solid var(--color-brand-primary)',borderRadius:16,background:showDressUp?'var(--color-brand-primary)':'transparent',color:showDressUp?'#fff':'var(--color-brand-primary)',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6 }}>
          <TShirt size={16} /> {showDressUp ? '收起换装' : '换装'}
        </button>

        {showDressUp && (
          <div style={{ background:'var(--color-surface-primary)',borderRadius:12,padding:10,marginBottom:10,border:'1px solid var(--color-brand-subtle)' }}>
            {localSelItem && (
              <div style={{ display:'flex',flexDirection:'column',gap:6,marginBottom:10,padding:8,background:'var(--color-surface-card)',borderRadius:10,fontSize:12 }}>
                {/* 行1: 基本控制 */}
                <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:4,flexWrap:'wrap' }}>
                  <span style={{ fontSize:20 }}>{localSelItem.e}</span>
                  <span style={{ fontSize:10,color:'var(--color-text-secondary)' }}>x:{localSelItem.x}% y:{localSelItem.y}%</span>
                  <button onClick={()=>modSel(it=>({...it,s:Math.round(Math.max(0.3,Math.min(3,it.s-0.1))*10)/10}))} style={css.btn}><Minus size={12}/></button>
                  <span style={css.val}>{localSelItem.s}x</span>
                  <button onClick={()=>modSel(it=>({...it,s:Math.round(Math.min(3,it.s+0.1)*10)/10}))} style={css.btn}><Plus size={12}/></button>
                  <button onClick={()=>modSel(it=>({...it,r:Math.round((it.r-15)%360)}))} style={css.btn}>↺</button>
                  <span style={css.val}>{localSelItem.r}°</span>
                  <button onClick={()=>modSel(it=>({...it,r:Math.round((it.r+15)%360)}))} style={css.btn}>↻</button>
                  <button onClick={()=>modSel(it=>({...it,o:Math.round(Math.max(0,Math.min(1,(it.o||1)-0.1))*10)/10}))} style={css.btn}><Minus size={10}/></button>
                  <span style={css.val}>{Math.round((localSelItem.o||1)*100)}%</span>
                  <button onClick={()=>modSel(it=>({...it,o:Math.round(Math.min(1,(it.o||1)+0.1)*10)/10}))} style={css.btn}><Plus size={10}/></button>
                  <button onClick={handleRemoveSelected} style={{ ...css.btn,color:'#E74C3C',borderColor:'#E74C3C',marginLeft:8 }}>删除</button>
                </div>
                {/* 行2: 四边裁剪 */}
                <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:3,flexWrap:'wrap' }}>
                  <span style={{ fontSize:10,color:'var(--color-text-secondary)' }}>上</span>
                  <button onClick={()=>modSel(it=>({...it,ct:Math.max(0,(it.ct||0)-5)}))} style={css.btn}><Minus size={10}/></button>
                  <span style={{ ...css.val,minWidth:22 }}>{localSelItem.ct||0}%</span>
                  <button onClick={()=>modSel(it=>({...it,ct:Math.min(90,(it.ct||0)+5)}))} style={css.btn}><Plus size={10}/></button>
                  <span style={{ fontSize:10,color:'var(--color-text-secondary)' }}>右</span>
                  <button onClick={()=>modSel(it=>({...it,cr:Math.max(0,(it.cr||0)-5)}))} style={css.btn}><Minus size={10}/></button>
                  <span style={{ ...css.val,minWidth:22 }}>{localSelItem.cr||0}%</span>
                  <button onClick={()=>modSel(it=>({...it,cr:Math.min(90,(it.cr||0)+5)}))} style={css.btn}><Plus size={10}/></button>
                  <span style={{ fontSize:10,color:'var(--color-text-secondary)' }}>下</span>
                  <button onClick={()=>modSel(it=>({...it,cb:Math.max(0,(it.cb||0)-5)}))} style={css.btn}><Minus size={10}/></button>
                  <span style={{ ...css.val,minWidth:22 }}>{localSelItem.cb||0}%</span>
                  <button onClick={()=>modSel(it=>({...it,cb:Math.min(90,(it.cb||0)+5)}))} style={css.btn}><Plus size={10}/></button>
                  <span style={{ fontSize:10,color:'var(--color-text-secondary)' }}>左</span>
                  <button onClick={()=>modSel(it=>({...it,cl:Math.max(0,(it.cl||0)-5)}))} style={css.btn}><Minus size={10}/></button>
                  <span style={{ ...css.val,minWidth:22 }}>{localSelItem.cl||0}%</span>
                  <button onClick={()=>modSel(it=>({...it,cl:Math.min(90,(it.cl||0)+5)}))} style={css.btn}><Plus size={10}/></button>
                </div>
              </div>
            )}

            {!localSelItem && (
              <p style={{ fontSize:11,color:'var(--color-text-secondary)',marginBottom:8 }}>
                点击下方配饰添加 → 拖动任意位置 → 缩放旋转 → 四边裁剪
              </p>
            )}

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

const css = {
  btn: { width:26,height:26,borderRadius:6,border:'1px solid var(--color-brand-subtle)',background:'var(--color-surface-primary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'var(--color-text-primary)' },
  val: { fontSize:11,minWidth:30,textAlign:'center',color:'var(--color-text-secondary)' },
}
