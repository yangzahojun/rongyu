import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { PencilSimple, X, FloppyDisk, Plus } from '@phosphor-icons/react'

export default function ObservationModal({ classData, date, existingObservations, onClose, onSaved }) {
  const [observerName, setObserverName] = useState('')
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
    if (!observerName.trim()) return

    setSaving(true)
    try {
      if (editingId) {
        await supabase.from('observations')
          .update({ observer_name: observerName.trim() })
          .eq('id', editingId)
      } else {
        await supabase.from('observations').insert({
          class_id: classData.id,
          observation_date: date,
          observer_name: observerName.trim(),
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
      await supabase.from('observations').delete().eq('id', id)
      onSaved()
    } catch (err) {
      console.error('删除失败:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const startEdit = (obs) => {
    setEditingId(obs.id)
    setObserverName(obs.observer_name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setObserverName('')
  }

  return (
    <div style={overlayStyle} onClick={onClose} role="dialog" aria-modal="true" aria-label={`${classData.name} - ${date} 听课编辑`}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()} ref={modalRef}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>
          {classData.name}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
          {date} · 听课安排
        </p>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14, background: 'var(--color-surface-primary)', padding: '6px 10px', borderRadius: 8 }}>
          <span role="img" aria-label="info">💡</span> 记录哪位老师来这个班听课
        </p>

        {existingObservations.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              已安排听课 ({existingObservations.length})
            </div>
            {existingObservations.map((obs) => (
              <div key={obs.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                background: obs.id === editingId ? 'var(--color-brand-subtle)' : 'var(--color-surface-primary)',
                borderRadius: 8,
                marginBottom: 6,
                fontSize: 13,
              }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{obs.observer_name}</span>
                  <span style={{ color: 'var(--color-text-secondary)', marginLeft: 8, fontSize: 12 }}>
                    听课
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => startEdit(obs)}
                    aria-label={`编辑 ${obs.observer_name} 的听课`}
                    style={{
                      background: 'none', border: 'none',
                      color: 'var(--color-brand-emphasis)', cursor: 'pointer',
                      fontSize: 13, padding: '2px 6px',
                    }}
                  >
                    <PencilSimple size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(obs.id)}
                    disabled={deletingId === obs.id}
                    aria-label={`删除 ${obs.observer_name} 的听课`}
                    style={{
                      background: 'none', border: 'none',
                      color: 'var(--color-danger)', cursor: 'pointer',
                      fontSize: 16, lineHeight: 1, padding: '2px 6px',
                    }}
                  >
                    {deletingId === obs.id ? '...' : <X size={16} weight="bold" />}
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
            {editingId ? '编辑听课' : '添加听课'}
          </span>
        </div>

        <label style={labelStyle} htmlFor="observer-name-input">听课老师</label>
        <input
          id="observer-name-input"
          className="input"
          value={observerName}
          onChange={(e) => setObserverName(e.target.value)}
          placeholder="填写听课老师名字"
          style={{ marginBottom: 16 }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 1 }}
          >
            {saving ? '保存中...' : editingId ? <><FloppyDisk size={16} style={{ marginRight: 4, verticalAlign: -2 }} />更新听课</> : <><Plus size={16} style={{ marginRight: 4, verticalAlign: -2 }} />添加听课</>}
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
