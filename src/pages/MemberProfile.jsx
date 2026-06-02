import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { CaretLeft, User, PencilSimple, Trash, Calendar, BookOpen } from '@phosphor-icons/react'
import DiaryCard from '../components/DiaryCard'
import { getMemberImage } from '../memberImages'

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

  useEffect(() => {
    fetchMember()
  }, [id])

  const fetchMember = async () => {
    const { data } = await supabase.from('members').select('*').eq('id', id).single()
    if (data) {
      setMember(data)
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
        <div style={{
          width: 120,
          height: 160,
          margin: '0 auto 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {(getMemberImage(member.name) || member.avatar_url) ? (
            <img
              src={getMemberImage(member.name) || member.avatar_url}
              alt={member.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'bottom center',
              }}
            />
          ) : (
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-subtle))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <User size={32} color="#FFF" />
            </div>
          )}
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          {member.name}
        </h2>

        {editing ? (
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
