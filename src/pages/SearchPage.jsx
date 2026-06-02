import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { MagnifyingGlass, Calendar, BookOpen } from '@phosphor-icons/react'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ courses: [], diaries: [] })
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults({ courses: [], diaries: [] })
      setHasSearched(false)
      return
    }

    setSearching(true)
    setHasSearched(true)

    const pattern = `%${q.trim()}%`

    const { data: courseResults } = await supabase
      .from('courses')
      .select('*, classes(name)')
      .or(`course_name.ilike.${pattern},teacher_name.ilike.${pattern}`)
      .order('course_date', { ascending: false })
      .limit(20)

    const { data: diaryResults } = await supabase
      .from('diaries')
      .select('*')
      .or(`content_text.ilike.${pattern},author_name.ilike.${pattern}`)
      .order('created_at', { ascending: false })
      .limit(15)

    setResults({
      courses: courseResults || [],
      diaries: diaryResults || [],
    })
    setSearching(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300)
    return () => clearTimeout(timer)
  }, [query, doSearch])

  return (
    <div className="page-content">
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <MagnifyingGlass size={22} weight="fill" style={{ color: 'var(--color-brand-primary)' }} />
          搜索
        </h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
          按关键词搜索日记和课程安排
        </p>

        <div style={{ position: 'relative' }}>
          <MagnifyingGlass size={18} color="var(--color-text-secondary)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索课程、老师、日记内容..."
            aria-label="搜索关键词"
            style={{ paddingLeft: 38 }}
          />
        </div>
      </div>

      {searching && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>
          搜索中...
        </div>
      )}

      {!searching && hasSearched && results.courses.length === 0 && results.diaries.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            没有找到相关结果
          </p>
        </div>
      )}

      {!hasSearched && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <MagnifyingGlass size={36} color="var(--color-brand-subtle)" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            输入关键词搜索日记和课程
          </p>
        </div>
      )}

      {!searching && results.courses.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={18} weight="fill" style={{ color: 'var(--color-brand-primary)' }} />
            课程 ({results.courses.length})
          </h3>
          {results.courses.map((c) => (
            <div key={c.id} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '6px 0', borderBottom: '1px solid var(--color-brand-subtle)',
              fontSize: 13,
            }}>
              <span style={{ fontWeight: 500 }}>{c.course_name}</span>
              <span>{c.teacher_name}</span>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                {c.classes?.name} / {c.course_date}
              </span>
            </div>
          ))}
        </div>
      )}

      {!searching && results.diaries.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BookOpen size={18} weight="fill" style={{ color: 'var(--color-brand-primary)' }} />
            日记 ({results.diaries.length})
          </h3>
          {results.diaries.map((d) => (
            <div key={d.id} style={{
              padding: '6px 0', borderBottom: '1px solid var(--color-brand-subtle)',
              fontSize: 13,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontWeight: 500 }}>
                  <span style={{ color: 'var(--color-brand-primary)', marginRight: 2 }}>&#x1F338;</span>
                  {d.author_name}
                </span>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>{d.diary_date}</span>
              </div>
              <p style={{ color: 'var(--color-text-primary)', lineHeight: 1.5, fontSize: 13 }}>
                {d.content_text?.slice(0, 100)}{d.content_text?.length > 100 ? '...' : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
