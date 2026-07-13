import { useState, useEffect } from 'react'
import { PencilSimple, Trash, DownloadSimple, Heart, ChatCircle, PaperPlaneTilt, X } from '@phosphor-icons/react'

const LS_NAME_KEY = 'rongyu_my_nickname'
const LS_LIKED_KEY = 'rongyu_liked_diary_ids'

function getMyName() {
  return localStorage.getItem(LS_NAME_KEY) || ''
}

function setMyName(name) {
  localStorage.setItem(LS_NAME_KEY, name.trim())
}

function getLikedIds() {
  try {
    return JSON.parse(localStorage.getItem(LS_LIKED_KEY) || '[]')
  } catch { return [] }
}

function addLikedId(id) {
  const ids = getLikedIds()
  if (!ids.includes(id)) {
    ids.push(id)
    localStorage.setItem(LS_LIKED_KEY, JSON.stringify(ids))
  }
}

function removeLikedId(id) {
  const ids = getLikedIds().filter((x) => x !== id)
  localStorage.setItem(LS_LIKED_KEY, JSON.stringify(ids))
}

export default function DiaryCard({ diary, onDelete, onEdit, likes, comments, onLike, onUnlike, onComment, onDeleteComment }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(diary.content_text || '')
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // 评论相关状态
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentAuthor, setCommentAuthor] = useState(() => getMyName())
  const [showNameInput, setShowNameInput] = useState(!getMyName())
  const [localMyName, setLocalMyName] = useState(() => getMyName())

  const dateLabel = new Date(diary.diary_date).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const hasMedia = (diary.image_urls?.length > 0) || (diary.video_urls?.length > 0)
  const textPreview = diary.content_text?.slice(0, 120) || ''

  const likeCount = likes?.length || 0
  const commentCount = comments?.length || 0

  // 判断当前用户是否已点赞
  const likedIds = getLikedIds()
  const isLikedByMe = likedIds.includes(diary.id) || (likes || []).some((l) => l.liker_name === localMyName && localMyName)

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

  const handleLike = async () => {
    const name = localMyName || getMyName()
    if (!name) {
      setShowNameInput(true)
      return
    }
    if (isLikedByMe) {
      // 取消点赞
      addLikedId(diary.id) // 稍后在 onUnlike 回调中移除
      await onUnlike(diary.id, name)
    } else {
      addLikedId(diary.id)
      await onLike(diary.id, name)
    }
  }

  const handleCommentSubmit = async () => {
    const name = commentAuthor.trim() || localMyName
    if (!name) {
      setShowNameInput(true)
      return
    }
    if (!commentText.trim()) return

    if (name !== localMyName) {
      setLocalMyName(name)
      setMyName(name)
    }
    setShowNameInput(false)
    await onComment(diary.id, name, commentText.trim())
    setCommentText('')
  }

  const handleSaveName = () => {
    const name = commentAuthor.trim()
    if (!name) return
    setLocalMyName(name)
    setMyName(name)
    setShowNameInput(false)
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

          {/* ===== 点赞 & 评论操作栏 ===== */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            marginTop: hasMedia || diary.content_text ? 12 : 0,
            paddingTop: 10,
            borderTop: `1px solid var(--color-brand-subtle)`,
          }}>
            {/* 点赞按钮 */}
            <button
              onClick={handleLike}
              aria-label={isLikedByMe ? '取消点赞' : '点赞'}
              style={{
                ...actionBtnStyle,
                display: 'flex', alignItems: 'center', gap: 4,
                color: isLikedByMe ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                opacity: 1,
                fontSize: 13,
              }}
            >
              <Heart size={18} weight={isLikedByMe ? 'fill' : 'regular'} />
              <span>{likeCount}</span>
            </button>

            {/* 评论按钮 */}
            <button
              onClick={() => setShowComments(!showComments)}
              aria-label={showComments ? '收起评论' : '查看评论'}
              aria-expanded={showComments}
              style={{
                ...actionBtnStyle,
                display: 'flex', alignItems: 'center', gap: 4,
                opacity: 1,
                fontSize: 13,
              }}
            >
              <ChatCircle size={18} weight={showComments ? 'fill' : 'regular'} />
              <span>{commentCount}</span>
            </button>
          </div>

          {/* ===== 评论区 ===== */}
          {showComments && (
            <div style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: `1px solid var(--color-brand-subtle)`,
              animation: 'bubbleIn 0.25s ease-out',
            }}>
              {/* 已有评论列表 */}
              {comments && comments.length > 0 ? (
                <div style={{ marginBottom: 10 }}>
                  {comments.map((c) => (
                    <div key={c.id} style={{
                      padding: '8px 0',
                      borderBottom: '1px solid var(--color-brand-subtle)',
                      position: 'relative',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-brand-emphasis)' }}>
                          {c.author_name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                            {new Date(c.created_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                          </span>
                          {onDeleteComment && c.author_name === localMyName && (
                            <button
                              onClick={() => onDeleteComment(c.id)}
                              aria-label="删除评论"
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: 0, display: 'flex', opacity: 0.5,
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>
                        {c.content_text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center', padding: '8px 0', marginBottom: 8 }}>
                  还没有评论，来说两句吧
                </p>
              )}

              {/* 发评论表单 */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                {showNameInput ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1, minWidth: 200 }}>
                    <input
                      className="input"
                      value={commentAuthor}
                      onChange={(e) => setCommentAuthor(e.target.value)}
                      placeholder="你的名字"
                      style={{ flex: 1, fontSize: 13, padding: '7px 10px', minHeight: 36 }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    />
                    <button className="btn-primary" onClick={handleSaveName} style={{ fontSize: 12, padding: '6px 12px' }}>
                      确定
                    </button>
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      {localMyName}
                    </span>
                    <input
                      className="input"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="写评论..."
                      style={{ flex: 1, fontSize: 13, padding: '7px 10px', minHeight: 36 }}
                      onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                    />
                    <button
                      className="btn-primary"
                      onClick={handleCommentSubmit}
                      disabled={!commentText.trim()}
                      aria-label="发送评论"
                      style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <PaperPlaneTilt size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
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
