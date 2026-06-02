import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { PencilSimple, X, FloppyDisk, Plus } from '@phosphor-icons/react'

export default function CourseModal({ classData, date, existingCourses, onClose, onSaved }) {
  const [courseName, setCourseName] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const modalRef = useRef(null)

  useEffect(() => {
    const prevFocus = document.activeElement
    const firstInput = modalRef.current?.querySelector('input')
    firstInput?.focus()

    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)

    return () => {
      prevFocus?.focus()
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const handleSave = async () => {
    if (!courseName.trim() || !teacherName.trim()) return

    setSaving(true)
    try {
      if (editingId) {
        await supabase.from('courses')
          .update({ course_name: courseName.trim(), teacher_name: teacherName.trim() })
          .eq('id', editingId)
      } else {
        await supabase.from('courses').insert({
          class_id: classData.id,
          course_date: date,
          course_name: courseName.trim(),
          teacher_name: teacherName.trim(),
        })
      }
      onSaved()
    } catch (err) {
      console.error('保存失败:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await supabase.from('courses').delete().eq('id', id)
      onSaved()
    } catch (err) {
      console.error('删除失败:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const startEdit = (course) => {
    setEditingId(course.id)
    setCourseName(course.course_name)
    setTeacherName(course.teacher_name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setCourseName('')
    setTeacherName('')
  }

  return (
    <div style={overlayStyle} onClick={onClose} role="dialog" aria-modal="true" aria-label={`${classData.name} - ${date} 课程编辑`}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()} ref={modalRef}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>
          {classData.name}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
          {date}
        </p>

        {existingCourses.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              已排课程 ({existingCourses.length})
            </div>
            {existingCourses.map((c) => (
              <div key={c.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                background: c.id === editingId ? 'var(--color-brand-subtle)' : 'var(--color-surface-primary)',
                borderRadius: 8,
                marginBottom: 6,
                fontSize: 13,
              }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{c.course_name}</span>
                  <span style={{ color: 'var(--color-text-secondary)', marginLeft: 8, fontSize: 12 }}>
                    {c.teacher_name}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => startEdit(c)}
                    aria-label={`编辑课程 ${c.course_name}`}
                    style={{
                      background: 'none', border: 'none',
                      color: 'var(--color-brand-emphasis)', cursor: 'pointer',
                      fontSize: 13, padding: '2px 6px',
                    }}
                  >
                    <PencilSimple size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    aria-label={`删除课程 ${c.course_name}`}
                    style={{
                      background: 'none', border: 'none',
                      color: 'var(--color-danger)', cursor: 'pointer',
                      fontSize: 16, lineHeight: 1, padding: '2px 6px',
                    }}
                  >
                    {deletingId === c.id ? '...' : <X size={16} weight="bold" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{
          borderTop: '1px dashed var(--color-brand-subtle)',
          margin: '12px 0',
          position: 'relative',
        }}>
          <span style={{
            position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--color-surface-card)', padding: '0 8px', fontSize: 11, color: 'var(--color-text-secondary)',
          }}>
            {editingId ? '编辑课程' : '添加新课'}
          </span>
        </div>

        <label style={labelStyle} htmlFor="course-name-input">课程名称</label>
        <input
          id="course-name-input"
          className="input"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          placeholder="如：趣味数学、英语口语..."
          style={{ marginBottom: 10 }}
        />

        <label style={labelStyle} htmlFor="teacher-name-input">授课老师</label>
        <input
          id="teacher-name-input"
          className="input"
          value={teacherName}
          onChange={(e) => setTeacherName(e.target.value)}
          placeholder="填写名字"
          style={{ marginBottom: 16 }}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 1 }}
          >
            {saving ? '保存中...' : editingId ? <><FloppyDisk size={16} style={{ marginRight: 4, verticalAlign: -2 }} />更新课程</> : <><Plus size={16} style={{ marginRight: 4, verticalAlign: -2 }} />添加课程</>}
          </button>
          {editingId ? (
            <button className="btn-outline" onClick={cancelEdit}>
              取消编辑
            </button>
          ) : (
            <button className="btn-outline" onClick={onClose}>
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.4)',
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
}

const modalStyle = {
  background: 'var(--color-surface-card)',
  borderRadius: 12,
  padding: 24,
  width: '100%',
  maxWidth: 360,
  maxHeight: '80vh',
  overflowY: 'auto',
  boxShadow: 'var(--shadow-modal)',
}

const labelStyle = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  marginBottom: 4,
  display: 'block',
}
