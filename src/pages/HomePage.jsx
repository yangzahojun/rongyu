import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { Calendar, Users, BookOpen, PencilSimple, Image } from '@phosphor-icons/react'
import MemberCard from '../components/MemberCard'
import memberImages from '../memberImages'

const POS_KEY = 'rongyu_member_positions'
const CARD_W = 75
const CARD_H = 110

function calcGridPositions(members) {
  const cols = 4
  const gapX = 8
  const gapY = 12
  return members.reduce((acc, m, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    acc[m.name] = { x: col * (CARD_W + gapX), y: row * (CARD_H + gapY) }
    return acc
  }, {})
}

export default function HomePage() {
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [positions, setPositions] = useState({})
  const [recentDiaries, setRecentDiaries] = useState([])
  const [todayCourses, setTodayCourses] = useState([])
  const [dragging, setDragging] = useState(null)
  const containerRef = useRef(null)
  const offsetRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    let savedPos
    try { savedPos = JSON.parse(localStorage.getItem(POS_KEY)) } catch {}

    const { data: m } = await supabase.from('members').select('*').order('id')
    let merged
    if (m) {
      const dbNames = new Set(m.map((x) => x.name))
      const extras = Object.keys(memberImages)
        .filter((name) => !dbNames.has(name))
        .map((name, i) => ({ id: `local-${i}`, name, bio: '', avatar_url: null }))
      merged = [...m, ...extras]
    } else {
      merged = Object.keys(memberImages).map((name, i) => ({ id: `local-${i}`, name, bio: '', avatar_url: null }))
    }
    setMembers(merged)
    setPositions(savedPos || calcGridPositions(merged))

    const today = new Date().toISOString().split('T')[0]
    const { data: c } = await supabase
      .from('courses')
      .select('*, classes(name)')
      .eq('course_date', today)
      .order('created_at', { ascending: false })
    if (c) setTodayCourses(c)

    const { data: d } = await supabase
      .from('diaries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)
    if (d) setRecentDiaries(d)
  }

  const containerHeight = members.length === 0 ? 0
    : Math.max(...members.map((m) => {
        const p = positions[m.name] || { x: 0, y: 0 }
        return p.y + CARD_H
      })) + 10

  const handlePointerDown = (e, memberId) => {
    e.preventDefault()
    const rect = containerRef.current.getBoundingClientRect()
    const pos = positions[memberId] || { x: 0, y: 0 }
    offsetRef.current = {
      x: e.clientX - rect.left - pos.x,
      y: e.clientY - rect.top - pos.y,
    }
    setDragging(memberId)
  }

  const handlePointerMove = useCallback((e) => {
    if (!dragging) return
    const rect = containerRef.current.getBoundingClientRect()
    const newX = Math.max(0, e.clientX - rect.left - offsetRef.current.x)
    const newY = Math.max(0, e.clientY - rect.top - offsetRef.current.y)
    setPositions((prev) => ({ ...prev, [dragging]: { x: newX, y: newY } }))
  }, [dragging])

  const handlePointerUp = useCallback(() => {
    if (!dragging) return
    setPositions((prev) => {
      try { localStorage.setItem(POS_KEY, JSON.stringify(prev)) } catch {}
      return prev
    })
    setDragging(null)
  }, [dragging])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      return () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
      }
    }
  }, [dragging, handlePointerMove, handlePointerUp])

  const handleReset = () => {
    const grid = calcGridPositions(members)
    setPositions(grid)
    try { localStorage.removeItem(POS_KEY) } catch {}
  }

  return (
    <div className="page-content">
      {/* 小弯欢迎横幅 */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-surface-primary) 0%, var(--color-brand-subtle) 100%)',
        borderRadius: 12,
        padding: 'var(--space-3) var(--space-4)',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <img src="xiaowan.png" alt="小弯" style={{ height: 56 }} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-brand-emphasis)' }}>欢迎来到蓉育向阳!</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>小弯陪你一起记录支教时光 <span aria-hidden="true">&#x1F338;</span></div>
        </div>
      </div>

      {/* 顶部快捷入口 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button
          className="btn-primary"
          onClick={() => navigate('/diary')}
          aria-label="写日记"
          style={{ flex: 1, fontSize: 15, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <PencilSimple size={18} /> 写日记
        </button>
        <button
          className="btn-primary"
          onClick={() => navigate('/showcase')}
          aria-label="风采展示"
          style={{ flex: 1, fontSize: 15, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-emphasis))' }}
        >
          <Image size={18} /> 风采展示
        </button>
      </div>

      {/* 今日课程概览 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={18} weight="fill" style={{ color: 'var(--color-brand-primary)' }} />
          今日课程 ({todayCourses.length}节)
        </h2>
        {todayCourses.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
            今天还没有课程安排
          </p>
        ) : (
          todayCourses.map((c) => (
            <div key={c.id} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '6px 0', borderBottom: '1px solid var(--color-brand-subtle)',
              fontSize: 13,
            }}>
              <span style={{ fontWeight: 500 }}>{c.course_name}</span>
              <span>{c.teacher_name}</span>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{c.classes?.name}</span>
            </div>
          ))
        )}
      </div>

      {/* 成员区域 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 10,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={18} weight="fill" style={{ color: 'var(--color-brand-primary)' }} />
          支教队成员 ({members.length}人)
        </h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>拖动可自由排列</span>
          <button
            onClick={handleReset}
            style={{
              fontSize: 11, padding: '2px 8px',
              border: '1px solid var(--color-brand-subtle)',
              borderRadius: 8, background: 'transparent',
              color: 'var(--color-text-secondary)', cursor: 'pointer',
            }}
          >
            重置
          </button>
        </div>
      </div>

      {/* 成员自由画布 */}
      {members.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 24, marginBottom: 16 }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
            暂无成员数据
          </p>
        </div>
      ) : (
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            width: '100%',
            height: containerHeight,
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          {members.map((m) => {
            const pos = positions[m.name] || { x: 0, y: 0 }
            return (
              <MemberCard
                key={m.id}
                member={m}
                style={{
                  left: pos.x,
                  top: pos.y,
                  cursor: dragging === m.name ? 'grabbing' : 'grab',
                  opacity: dragging === m.name ? 0.7 : 1,
                  zIndex: dragging === m.name ? 10 : 1,
                  transition: dragging === m.name ? 'none' : 'opacity 0.15s',
                }}
                onPointerDown={(e) => handlePointerDown(e, m.name)}
              />
            )
          })}
        </div>
      )}

      {/* 连接线 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
      }}>
        <div style={{ flex: 1, height: 1, background: 'var(--color-brand-subtle)' }} />
        <BookOpen size={14} weight="fill" style={{ color: 'var(--color-brand-primary)' }} />
        <div style={{ flex: 1, height: 1, background: 'var(--color-brand-subtle)' }} />
      </div>

      {/* 最新日记 */}
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        最新日记
      </h2>
      {recentDiaries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
            还没有队员分享日记，快来写第一篇吧 <span aria-hidden="true">&#x1F338;</span>
          </p>
        </div>
      ) : (
        recentDiaries.map((d) => (
          <div key={d.id} className="card" style={{ marginBottom: 10, cursor: 'pointer' }}
            onClick={() => {
              const m = members.find((m) => m.name === d.author_name && typeof m.id === 'number')
              if (m) navigate(`/member/${m.id}`)
              else navigate('/diary')
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const m = members.find((m) => m.name === d.author_name && typeof m.id === 'number'); if (m) navigate(`/member/${m.id}`); else navigate('/diary') } }}
            role="button"
            tabIndex={0}
            aria-label={`${d.author_name}的日记`}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                <span style={{ color: 'var(--color-brand-primary)', marginRight: 2 }}>&#x1F338;</span>
                {d.author_name}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{d.diary_date}</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
              {d.content_text?.slice(0, 80)}{d.content_text?.length > 80 ? '...' : ''}
            </p>
            {(d.image_urls?.length > 0 || d.video_urls?.length > 0) && (
              <span style={{ fontSize: 11, color: 'var(--color-brand-emphasis)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Image size={14} /> 含媒体内容
              </span>
            )}
          </div>
        ))
      )}
    </div>
  )
}
