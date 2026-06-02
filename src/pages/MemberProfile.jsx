import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { CaretLeft, User, PencilSimple, Trash, Calendar, BookOpen, TShirt, Plus, Minus } from '@phosphor-icons/react'
import DiaryCard from '../components/DiaryCard'
import { getMemberImage } from '../memberImages'
import { ACCESSORY_CATS, CAT_NAMES, loadOutfit, saveOutfit, ACC_FONT_RATIO, loadCanvasState, saveCanvasState, DEFAULT_MEMBER_SIZE, onSharedStateChange } from '../outfitUtils'

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

  const charRef = useRef(null)
  const outfitRef = useRef([])
  const selRef = useRef(null)
  const memberRef = useRef(null)
  const charZoomRef = useRef(1)
  const prevSelEl = useRef(null)

  useEffect(() => { outfitRef.current = outfit }, [outfit])
  useEffect(() => { selRef.current = selIdx }, [selIdx])
  useEffect(() => { memberRef.current = member }, [member])
  useEffect(() => { charZoomRef.current = charZoom }, [charZoom])

  // 订阅 Supabase 同步：别人修改装扮后自动刷新
  useEffect(() => {
    return onSharedStateChange(() => {
      const m = memberRef.current
      if (!m) return
      // 重新读 localStorage（已被 sync 更新）
      setOutfit(loadOutfit(m.name))
      const canvas = loadCanvasState()
      const sz = (canvas.sizes && canvas.sizes[m.name]) || DEFAULT_MEMBER_SIZE
      const z = Math.round(sz / DEFAULT_MEMBER_SIZE * 10) / 10
      setCharZoom(z)
    })
  }, [])

  const isLocalId = typeof id === 'string' && id.startsWith('local-')
  const localName = isLocalId ? id.replace('local-', '') : null

  useEffect(() => {
    if (isLocalId) {
      setMember({ id, name: localName, bio: '', avatar_url: null })
      setOutfit(loadOutfit(localName))
      const canvas = loadCanvasState()
      const sz = (canvas.sizes && canvas.sizes[localName]) || DEFAULT_MEMBER_SIZE
      const z = Math.round(sz / DEFAULT_MEMBER_SIZE * 10) / 10
      setCharZoom(z)
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
        const canvas = loadCanvasState()
        const sz = (canvas.sizes && canvas.sizes[data.name]) || DEFAULT_MEMBER_SIZE
        setCharZoom(Math.round(sz / DEFAULT_MEMBER_SIZE * 10) / 10)
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

  const persistZoom = (z) => {
    const canvas = loadCanvasState()
    const sz = Math.round(DEFAULT_MEMBER_SIZE * z)
    const sizes = { ...(canvas.sizes || {}), [memberRef.current?.name || '']: sz }
    saveCanvasState({ positions: canvas.positions || {}, sizes })
  }

  const persistOutfit = (items) => {
    outfitRef.current = items
    saveOutfit(memberRef.current?.name, items)
    setOutfit(items)
  }

  const commitOutfit = () => {
    const final = outfitRef.current
    saveOutfit(memberRef.current?.name, final)
    setOutfit([...final])
  }

  const handleAddAccessory = (emoji) => {
    const item = { e: emoji, x: 50, y: 20, s: 1, r: 0, o: 1 }
    const n = [...outfitRef.current, item]
    persistOutfit(n)
    setSelIdx(n.length - 1)
  }

  const handleRemoveSelected = () => {
    if (selIdx == null) return
    clearHighlight()
    const n = outfitRef.current.filter((_, i) => i !== selIdx)
    persistOutfit(n)
    setSelIdx(null)
  }

  const modSelCommitted = (fn) => {
    const idx = selIdx
    if (idx == null) return
    persistOutfit(outfitRef.current.map((it, i) => i !== idx ? it : fn(it)))
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

  // ============ 原生DOM拖动系统（完全绕过React合成事件） ============
  const dragState = useRef({ type: null, idx: null, el: null, offX: 0, offY: 0, edge: null, startV: 0, startP: 0 })

  useEffect(() => {
    if (!showDressUp) return
    const c = charRef.current
    if (!c) return

    const d = dragState

    // --- down ---
    const onDown = (e) => {
      // 裁剪手柄
      const clipH = e.target.closest('[data-clip]')
      if (clipH) {
        e.preventDefault(); e.stopPropagation()
        const edge = clipH.dataset.clip
        d.current.type = 'clip'; d.current.edge = edge
        d.current.startV = (outfitRef.current[selRef.current] || {})[edge] || 0
        d.current.startP = edge === 'ct' || edge === 'cb' ? e.clientY : e.clientX
        clipH.setPointerCapture(e.pointerId)
        return
      }
      // 配饰
      const acc = e.target.closest('[data-acc]')
      if (acc) {
        e.preventDefault(); e.stopPropagation()
        const idx = Number(acc.dataset.acc)
        selRef.current = idx
        d.current.type = 'acc'; d.current.idx = idx; d.current.el = acc
        acc.setPointerCapture(e.pointerId)
        acc.style.cursor = 'grabbing'
        highlightEl(acc)
        const rect = c.getBoundingClientRect()
        const item = outfitRef.current[idx]
        d.current.offX = e.clientX - rect.left - ((item.x ?? 50) / 100) * rect.width
        d.current.offY = e.clientY - rect.top - ((item.y ?? 20) / 100) * rect.height
        return
      }
      // 空白：取消选中（由move/up检测，这里什么也不做）
    }

    // --- move ---
    const onMove = (e) => {
      if (d.current.type === 'clip' && d.current.edge) {
        e.preventDefault()
        const { edge, startV, startP } = d.current
        const isV = edge === 'ct' || edge === 'cb'
        const delta = (isV ? e.clientY - startP : e.clientX - startP) / 2
        const sign = (edge === 'ct' || edge === 'cl') ? 1 : -1
        const val = Math.round(Math.max(0, Math.min(80, startV + delta * sign)))
        outfitRef.current = outfitRef.current.map((it, i) =>
          i !== selRef.current ? it : { ...it, [edge]: val }
        )
        // 直接更新配饰DOM
        const accEl = c.querySelector(`[data-acc="${selRef.current}"]`)
        if (accEl) {
          const it = outfitRef.current[selRef.current]
          const hc = (it.ct||0)>0||(it.cr||0)>0||(it.cb||0)>0||(it.cl||0)>0
          accEl.style.clipPath = hc ? `inset(${it.ct||0}% ${it.cr||0}% ${it.cb||0}% ${it.cl||0}%)` : ''
        }
        return
      }
      if (d.current.type === 'acc' && d.current.idx != null) {
        e.preventDefault()
        const rect = c.getBoundingClientRect()
        const x = Math.round(((e.clientX - d.current.offX) / rect.width) * 100)
        const y = Math.round(((e.clientY - d.current.offY) / rect.height) * 100)
        if (d.current.el) { d.current.el.style.left = `${x}%`; d.current.el.style.top = `${y}%` }
        outfitRef.current = outfitRef.current.map((it, i) =>
          i !== d.current.idx ? it : { ...it, x, y }
        )
      }
    }

    // --- up ---
    const onUp = (e) => {
      if (d.current.type === 'clip') {
        e && e.preventDefault()
        commitOutfit()
      } else if (d.current.type === 'acc' && d.current.idx != null) {
        e && e.preventDefault()
        if (d.current.el) {
          try { d.current.el.releasePointerCapture(e.pointerId) } catch {}
          d.current.el.style.cursor = 'grab'
        }
        commitOutfit()
        setSelIdx(d.current.idx)
      } else {
        // 点击空白 → 取消选中
        const acc = e && e.target ? e.target.closest('[data-acc]') : null
        if (!acc) {
          clearHighlight()
          setSelIdx(null)
          selRef.current = null
        }
      }
      d.current = { type: null, idx: null, el: null, offX: 0, offY: 0, edge: null, startV: 0, startP: 0 }
    }

    c.addEventListener('pointerdown', onDown)
    c.addEventListener('pointermove', onMove)
    c.addEventListener('pointerup', onUp)
    c.addEventListener('pointercancel', onUp)
    window.addEventListener('pointerup', (e) => {
      // 兜底：如果pointer在容器外释放，也清理状态
      if (d.current.type) onUp(e)
    })
    return () => {
      c.removeEventListener('pointerdown', onDown)
      c.removeEventListener('pointermove', onMove)
      c.removeEventListener('pointerup', onUp)
      c.removeEventListener('pointercancel', onUp)
    }
  }, [showDressUp])

  useEffect(() => {
    if (selIdx != null && selIdx >= outfit.length) {
      clearHighlight()
      setSelIdx(null)
    }
  }, [outfit, selIdx])

  if (loading) return <div className="page-content" style={{ textAlign:'center',padding:60,color:'var(--color-text-secondary)' }}>加载中...</div>
  if (!member) return <div className="page-content" style={{ textAlign:'center',padding:60 }}><p style={{ color:'var(--color-text-secondary)',fontSize:14 }}>{isLocalId?'成员不存在':'加载失败，请返回重试'}</p><button className="btn-outline" onClick={()=>navigate('/')} style={{ fontSize:13,padding:'6px 18px',marginTop:12 }}>返回首页</button></div>

  const avatarSrc = getMemberImage(member.name) || member.avatar_url
  const scaledW = CHAR_W * charZoom
  const scaledH = CHAR_H * charZoom
  const editorFont = Math.round(scaledW * ACC_FONT_RATIO)
  const localSelItem = selIdx != null ? outfit[selIdx] : null

  return (
    <div className="page-content">
      <button onClick={() => navigate('/')} aria-label="返回首页" style={{ background:'none',border:'none',cursor:'pointer',fontSize:14,color:'var(--color-brand-emphasis)',marginBottom:12,padding:0,display:'flex',alignItems:'center',gap:4 }}>
        <CaretLeft size={16} /> 返回首页
      </button>

      <div className="card" style={{ textAlign:'center',marginBottom:16 }}>
        {showDressUp && (
          <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:8 }}>
            <span style={{ fontSize:11,color:'var(--color-text-secondary)' }}>人物缩放</span>
            <button onClick={()=>{const z=Math.round(Math.max(0.5,Math.min(2,charZoomRef.current-0.1))*10)/10;setCharZoom(z);persistZoom(z)}} style={bs}><Minus size={12}/></button>
            <span style={{ fontSize:12,minWidth:36,textAlign:'center' }}>{Math.round(charZoom*100)}%</span>
            <button onClick={()=>{const z=Math.round(Math.min(2,charZoomRef.current+0.1)*10)/10;setCharZoom(z);persistZoom(z)}} style={bs}><Plus size={12}/></button>
          </div>
        )}

        <div style={{ display:'flex',justifyContent:'center',marginBottom:12 }}>
          <div ref={charRef} style={{
            width:scaledW,height:scaledH,position:'relative',overflow:'visible',
            touchAction:showDressUp?'none':undefined,userSelect:'none',
          }}>
            {avatarSrc ? (
              <img src={avatarSrc} alt={member.name} draggable={false} style={{ width:'100%',height:'100%',objectFit:'contain',objectPosition:'bottom center',position:'relative',zIndex:1,pointerEvents:'none' }} />
            ) : (
              <div style={{ width:64,height:64,borderRadius:'50%',position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'linear-gradient(135deg,var(--color-brand-primary),var(--color-brand-subtle))',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1 }}>
                <User size={32} color="#FFF" />
              </div>
            )}
            {outfit.map((item, i) => {
              const x = item.x ?? 50, y = item.y ?? 20
              const sv = item.s ?? 1, rv = item.r ?? 0, ov = item.o ?? 1
              const t = item.ct ?? 0, r = item.cr ?? 0, b = item.cb ?? 0, l = item.cl ?? 0
              const hc = t>0||r>0||b>0||l>0
              const isSel = selIdx === i && showDressUp
              return (
                <div key={i} data-acc={i} style={{
                  position:'absolute',left:`${x}%`,top:`${y}%`,
                  transform:`translate(-50%,-50%) scale(${sv}) rotate(${rv}deg)`,
                  fontSize:editorFont,zIndex:isSel?5:2,opacity:ov,
                  cursor:showDressUp?'grab':undefined,
                  pointerEvents:showDressUp?'auto':'none',
                  userSelect:'none',touchAction:'none',
                  clipPath:hc?`inset(${t}% ${r}% ${b}% ${l}%)`:undefined,
                  overflow:hc?'hidden':undefined,
                  filter:isSel?'drop-shadow(0 0 6px var(--color-brand-primary)) brightness(1.2)':undefined,
                }}>{item.e}</div>
              )
            })}
          </div>
        </div>

        <h2 style={{ fontSize:18,fontWeight:600,marginBottom:8 }}>{member.name}</h2>

        <button onClick={()=>{setShowDressUp(!showDressUp);setSelIdx(null);clearHighlight()}}
          style={{ fontSize:13,padding:'6px 16px',marginBottom:10,border:'1px solid var(--color-brand-primary)',borderRadius:16,background:showDressUp?'var(--color-brand-primary)':'transparent',color:showDressUp?'#fff':'var(--color-brand-primary)',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6 }}>
          <TShirt size={16} /> {showDressUp?'收起换装':'换装'}
        </button>

        {showDressUp && (
          <div style={{ background:'var(--color-surface-primary)',borderRadius:12,padding:10,marginBottom:10,border:'1px solid var(--color-brand-subtle)' }}>
            {localSelItem && (
              <div style={{ display:'flex',flexDirection:'column',gap:6,marginBottom:10,padding:8,background:'var(--color-surface-card)',borderRadius:10,fontSize:12 }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:4,flexWrap:'wrap' }}>
                  <span style={{ fontSize:20 }}>{localSelItem.e}</span>
                  <button onClick={()=>modSelCommitted(it=>({...it,s:Math.round(Math.max(0.3,Math.min(3,it.s-0.1))*10)/10}))} style={bs}><Minus size={12}/></button>
                  <span style={vs}>{localSelItem.s}x</span>
                  <button onClick={()=>modSelCommitted(it=>({...it,s:Math.round(Math.min(3,it.s+0.1)*10)/10}))} style={bs}><Plus size={12}/></button>
                  <button onClick={()=>modSelCommitted(it=>({...it,r:Math.round((it.r-15)%360)}))} style={bs}>↺</button>
                  <span style={vs}>{localSelItem.r}°</span>
                  <button onClick={()=>modSelCommitted(it=>({...it,r:Math.round((it.r+15)%360)}))} style={bs}>↻</button>
                  <button onClick={()=>modSelCommitted(it=>({...it,o:Math.round(Math.max(0,Math.min(1,(it.o||1)-0.1))*10)/10}))} style={bs}><Minus size={10}/></button>
                  <span style={vs}>{Math.round((localSelItem.o||1)*100)}%</span>
                  <button onClick={()=>modSelCommitted(it=>({...it,o:Math.round(Math.min(1,(it.o||1)+0.1)*10)/10}))} style={bs}><Plus size={10}/></button>
                  <button onClick={handleRemoveSelected} style={{ ...bs,color:'#E74C3C',borderColor:'#E74C3C',marginLeft:8 }}>删除</button>
                </div>
                {/* 可视化裁剪手柄 */}
                <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                  <span style={{ fontSize:10,color:'var(--color-text-secondary)' }}>裁剪(拖边缘):</span>
                  <div style={{ position:'relative',width:50,height:50,border:'2px solid var(--color-brand-primary)',borderRadius:4,background:'rgba(255,182,193,0.08)',overflow:'hidden' }}>
                    <div style={{ position:'absolute',top:`${localSelItem.ct||0}%`,right:`${localSelItem.cr||0}%`,bottom:`${localSelItem.cb||0}%`,left:`${localSelItem.cl||0}%`,background:'rgba(255,182,193,0.15)',border:'1px dashed var(--color-brand-primary)' }}/>
                    <div data-clip="ct" style={{ position:'absolute',top:`${(localSelItem.ct||0)/2}%`,left:'50%',transform:'translate(-50%,-50%)',width:'70%',height:8,cursor:'row-resize',background:'var(--color-brand-primary)',borderRadius:4,opacity:0.8,touchAction:'none' }}/>
                    <div data-clip="cb" style={{ position:'absolute',bottom:`${(localSelItem.cb||0)/2}%`,left:'50%',transform:'translate(-50%,50%)',width:'70%',height:8,cursor:'row-resize',background:'var(--color-brand-primary)',borderRadius:4,opacity:0.8,touchAction:'none' }}/>
                    <div data-clip="cl" style={{ position:'absolute',left:`${(localSelItem.cl||0)/2}%`,top:'50%',transform:'translate(-50%,-50%)',width:8,height:'70%',cursor:'col-resize',background:'var(--color-brand-primary)',borderRadius:4,opacity:0.8,touchAction:'none' }}/>
                    <div data-clip="cr" style={{ position:'absolute',right:`${(localSelItem.cr||0)/2}%`,top:'50%',transform:'translate(50%,-50%)',width:8,height:'70%',cursor:'col-resize',background:'var(--color-brand-primary)',borderRadius:4,opacity:0.8,touchAction:'none' }}/>
                  </div>
                </div>
              </div>
            )}

            {!localSelItem && (
              <p style={{ fontSize:11,color:'var(--color-text-secondary)',marginBottom:8 }}>点击下方配饰添加 → 拖动角色身上配饰移动 → 四边裁剪手柄</p>
            )}

            <div style={{ display:'flex',gap:3,marginBottom:8,flexWrap:'wrap',justifyContent:'center' }}>
              {CAT_NAMES.map(cat => (
                <button key={cat} onClick={()=>setActiveCat(cat)} style={{ fontSize:11,padding:'3px 8px',borderRadius:10,border:'none',background:activeCat===cat?'var(--color-brand-primary)':'var(--color-surface-card)',color:activeCat===cat?'#fff':'var(--color-text-secondary)',cursor:'pointer' }}>{cat}</button>
              ))}
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4 }}>
              {ACCESSORY_CATS[activeCat].map(e=>(<button key={e} onClick={()=>handleAddAccessory(e)} style={{ aspectRatio:'1',borderRadius:10,border:'1px solid var(--color-brand-subtle)',background:'var(--color-surface-card)',cursor:'pointer',fontSize:22,display:'flex',alignItems:'center',justifyContent:'center' }}>{e}</button>))}
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
        <h3 style={{ fontSize:15,fontWeight:600,marginBottom:10,display:'flex',alignItems:'center',gap:6 }}><Calendar size={18} weight="fill" style={{ color:'var(--color-brand-primary)' }}/> {member.name}的课程 ({courses.length}节)</h3>
        {courses.length===0 ? <p style={{ color:'var(--color-text-secondary)',fontSize:13 }}>暂未排课</p> : (
          <div style={{ maxHeight:200,overflowY:'auto' }}>{courses.map(c=>(<div key={c.id} style={{ display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--color-brand-subtle)',fontSize:13 }}><span>{c.course_date}</span><span style={{ fontWeight:500 }}>{c.course_name}</span><span style={{ color:'var(--color-text-secondary)',fontSize:12 }}>{c.classes?.name}</span></div>))}</div>
        )}
      </div>

      <h3 style={{ fontSize:15,fontWeight:600,marginBottom:10,display:'flex',alignItems:'center',gap:6 }}><BookOpen size={18} weight="fill" style={{ color:'var(--color-brand-primary)' }}/> {member.name}的日记 ({diaries.length}篇)</h3>
      {diaries.length===0 ? (
        <div className="card" style={{ textAlign:'center',padding:24 }}><p style={{ color:'var(--color-text-secondary)',fontSize:13 }}>ta还没有写过日记</p></div>
      ) : (
        diaries.map(diary=>(<DiaryCard key={diary.id} diary={diary} onEdit={async(dId,txt)=>{await supabase.from('diaries').update({content_text:txt}).eq('id',dId);fetchMember()}} onDelete={async(dId)=>{await supabase.from('diaries').delete().eq('id',dId);fetchMember()}}/>))
      )}
    </div>
  )
}

const bs = { width:26,height:26,borderRadius:6,border:'1px solid var(--color-brand-subtle)',background:'var(--color-surface-primary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'var(--color-text-primary)' }
const vs = { fontSize:11,minWidth:30,textAlign:'center',color:'var(--color-text-secondary)' }
