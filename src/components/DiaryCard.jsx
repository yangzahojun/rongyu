import { useState, useEffect } from 'react'
import { PencilSimple, Trash, DownloadSimple } from '@phosphor-icons/react'

export default function DiaryCard({ diary, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(diary.content_text || '')
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const dateLabel = new Date(diary.diary_date).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const hasMedia = (diary.image_urls?.length > 0) || (diary.video_urls?.length > 0)
  const textPreview = diary.content_text?.slice(0, 120) || ''

  useEffect(() => {
    if (!showDeleteConfirm) return
    const onKey = (e) => { if (e.key === 'Escape') setShowDeleteConfirm(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showDeleteConfirm])

  const handleSave = async () => {
    setSaving(true)
    await onEdit(diary.id, editText)
    setEditing(false)
    setSaving(false)
  }

  const handleDelete = async () => {
    await onDelete(diary.id)
    setShowDeleteConfirm(false)
  }

  return (
    <div className="card" style={{ marginBottom: 12, position: 'relative' }}>
      {!editing && (
        <div style={{ position: 'absolute', top: 10, right: 12, display: 'flex', gap: 8 }}>
          <button onClick={() => setEditing(true)} style={actionBtnStyle} aria-label="编辑日记">
            <PencilSimple size={16} />
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} style={actionBtnStyle} aria-label="删除日记">
            <Trash size={16} />
          </button>
        </div>
      )}

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8, paddingRight: 60,
      }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          <span style={{ color: 'var(--color-brand-primary)', marginRight: 4 }}>&#x1F338;</span>
          {diary.author_name}
        </span>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {dateLabel}
        </span>
      </div>

      {editing ? (
        <div>
          <textarea
            className="input"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            aria-label="编辑日记内容"
            style={{ marginBottom: 8, minHeight: 80 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ fontSize: 12, padding: '6px 16px' }}>
              {saving ? '保存中...' : '保存'}
            </button>
            <button className="btn-outline" onClick={() => { setEditing(false); setEditText(diary.content_text || '') }} style={{ fontSize: 12, padding: '6px 16px' }}>
              取消
            </button>
          </div>
        </div>
      ) : (
        <>
          {diary.content_text && (
            <div style={{
              fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-primary)',
              marginBottom: hasMedia ? 10 : 0,
              userSelect: 'text', whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {expanded || diary.content_text.length <= 150
                ? diary.content_text
                : (
                  <>
                    {textPreview}...
                    <button
                      onClick={() => setExpanded(true)}
                      aria-label="展开完整日记内容"
                      aria-expanded={expanded}
                      style={{
                        background: 'none', border: 'none', color: 'var(--color-brand-emphasis)',
                        cursor: 'pointer', fontSize: 13, padding: 0, marginLeft: 4,
                      }}
                    >
                      展开全文
                    </button>
                  </>
                )}
            </div>
          )}

          {diary.image_urls?.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: diary.image_urls.length === 1 ? '1fr' : '1fr 1fr',
              gap: 6,
              marginBottom: diary.video_urls?.length > 0 ? 8 : 0,
            }}>
              {diary.image_urls.map((url, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img
                    src={url}
                    alt={`图片 ${i + 1}`}
                    loading="lazy"
                    style={{
                      width: '100%',
                      borderRadius: 8,
                      maxHeight: 200,
                      objectFit: 'cover',
                      cursor: 'pointer',
                    }}
                    onClick={() => window.open(url, '_blank')}
                  />
                  <a
                    href={url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`下载图片 ${i + 1}`}
                    style={{
                      position: 'absolute', bottom: 6, right: 6,
                      background: 'rgba(0,0,0,0.5)', color: '#FFF',
                      borderRadius: 6, padding: '3px 8px', fontSize: 11,
                      textDecoration: 'none',
                    }}
                  >
                    <DownloadSimple size={12} style={{ marginRight: 2, verticalAlign: -1 }} />
                    下载
                  </a>
                </div>
              ))}
            </div>
          )}

          {diary.video_urls?.length > 0 && diary.video_urls.map((url, i) => (
            <video
              key={i}
              src={url}
              controls
              style={{ width: '100%', borderRadius: 8, maxHeight: 240 }}
            />
          ))}
        </>
      )}

      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 250,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }} onClick={() => setShowDeleteConfirm(false)}
        role="alertdialog" aria-modal="true" aria-label="确认删除日记">
          <div style={{
            background: '#FFF', borderRadius: 12, padding: 24,
            textAlign: 'center', maxWidth: 280,
          }} onClick={(e) => e.stopPropagation()}>
            <p style={{ fontSize: 15, marginBottom: 6 }}>确定删除这条日记吗？</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16 }}>删除后无法恢复</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-primary" onClick={handleDelete} style={{ background: 'var(--color-danger)', fontSize: 13, padding: '8px 20px' }}>
                确认删除
              </button>
              <button className="btn-outline" onClick={() => setShowDeleteConfirm(false)} style={{ fontSize: 13, padding: '8px 20px' }}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const actionBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '2px 4px',
  opacity: 0.6,
  color: 'var(--color-text-secondary)',
  display: 'flex',
  alignItems: 'center',
}
