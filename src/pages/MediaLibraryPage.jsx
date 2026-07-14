import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import {
  UploadSimple, Image, Video, DownloadSimple, X, Trash,
  CaretDown, CaretRight, FolderOpen, Faders,
} from '@phosphor-icons/react'

const BUCKET = 'media-library'

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB'
  return (bytes / 1073741824).toFixed(2) + ' GB'
}

function groupByDate(assets) {
  const map = {}
  for (const a of assets) {
    if (!map[a.asset_date]) map[a.asset_date] = []
    map[a.asset_date].push(a)
  }
  // 按日期倒序
  const keys = Object.keys(map).sort((a, b) => b.localeCompare(a))
  return keys.map((k) => ({ date: k, items: map[k] }))
}

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)

  // 上传表单
  const [uploaderName, setUploaderName] = useState('')
  const [notes, setNotes] = useState('')
  const [assetDate, setAssetDate] = useState(() => new Date().toISOString().split('T')[0])
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState([]) // { name, status: 'pending'|'uploading'|'done'|'error', error? }
  const fileInputRef = useRef(null)

  // 预览
  const [preview, setPreview] = useState(null) // { url, type }
  // 折叠面板
  const [collapsedDates, setCollapsedDates] = useState({})
  // 筛选
  const [filterDate, setFilterDate] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all' | 'image' | 'video'

  useEffect(() => { fetchAssets() }, [])

  const fetchAssets = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setAssets(data)
    setLoading(false)
  }

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files)
    setFiles((prev) => [...prev, ...selected])
    // 重置 file input 以便重复选同一文件
    e.target.value = ''
  }

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (!uploaderName.trim()) { alert('请填写你的名字'); return }
    if (files.length === 0) { alert('请选择文件'); return }

    setUploading(true)
    setUploadStatus(files.map((f) => ({ name: f.name, status: 'pending' })))

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploadStatus((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'uploading' } : s))

      try {
        const ext = file.name.split('.').pop()
        const datePrefix = assetDate.replace(/-/g, '/')
        const storagePath = `${datePrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

        // 原文件直传，不做任何压缩
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

        const fileType = file.type.startsWith('video/') ? 'video' : 'image'

        const { error: dbError } = await supabase.from('media_assets').insert({
          uploader_name: uploaderName.trim(),
          notes: notes.trim(),
          asset_date: assetDate,
          file_type: fileType,
          file_name: file.name,
          file_size: file.size,
          storage_path: storagePath,
          public_url: urlData.publicUrl,
        })

        if (dbError) throw dbError

        setUploadStatus((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'done' } : s))
      } catch (err) {
        console.error('上传失败:', file.name, err)
        setUploadStatus((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'error', error: err.message } : s))
      }
    }

    setUploading(false)
    setFiles([])
    setNotes('')
    fetchAssets()
  }

  const handleDelete = async (asset) => {
    if (!confirm(`确定删除 "${asset.file_name}" 吗？此操作不可撤销。`)) return

    try {
      // 删除 Storage 文件
      await supabase.storage.from(BUCKET).remove([asset.storage_path])
      // 删除数据库记录
      await supabase.from('media_assets').delete().eq('id', asset.id)
      fetchAssets()
      if (preview?.asset?.id === asset.id) setPreview(null)
    } catch (err) {
      console.error('删除失败:', err)
      alert('删除失败，请重试')
    }
  }

  const handleDownload = (asset) => {
    const a = document.createElement('a')
    a.href = asset.public_url
    a.download = asset.file_name
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const openPreview = (asset) => {
    setPreview({ url: asset.public_url, type: asset.file_type, asset })
  }

  const closePreview = () => setPreview(null)

  const toggleDateCollapse = (date) => {
    setCollapsedDates((prev) => ({ ...prev, [date]: !prev[date] }))
  }

  // 筛选
  let filteredAssets = assets
  if (filterDate) {
    filteredAssets = filteredAssets.filter((a) => a.asset_date === filterDate)
  }
  if (filterType !== 'all') {
    filteredAssets = filteredAssets.filter((a) => a.file_type === filterType)
  }

  const grouped = groupByDate(filteredAssets)

  const doneCount = uploadStatus.filter((s) => s.status === 'done').length
  const errorCount = uploadStatus.filter((s) => s.status === 'error').length

  return (
    <div className="page-content">
      {/* 上传区域 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <UploadSimple size={20} style={{ color: 'var(--color-brand-primary)' }} />
          上传素材
        </h3>

        {/* 姓名 + 日期 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle} htmlFor="media-uploader">你的名字 *</label>
            <input
              id="media-uploader"
              className="input"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              placeholder="输入你的名字"
              disabled={uploading}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle} htmlFor="media-date">素材日期 *</label>
            <input
              id="media-date"
              type="date"
              className="input"
              value={assetDate}
              onChange={(e) => setAssetDate(e.target.value)}
              disabled={uploading}
            />
          </div>
        </div>

        {/* 备注 */}
        <label style={labelStyle} htmlFor="media-notes">备注说明</label>
        <input
          id="media-notes"
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="如：运动会开幕式、课堂互动…"
          disabled={uploading}
          style={{ marginBottom: 12 }}
        />

        {/* 文件选择 */}
        <div style={{ marginBottom: 12 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="media-files"
            disabled={uploading}
          />
          <button
            className="btn-outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ width: '100%', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Image size={18} /> <Video size={18} /> 选择照片/视频（可多选，原文件直传）
          </button>
        </div>

        {/* 待上传文件列表 */}
        {files.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              待上传 ({files.length} 个文件)
            </div>
            <div style={{ maxHeight: 160, overflowY: 'auto' }}>
              {files.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 8px', fontSize: 12,
                  background: i % 2 === 0 ? 'var(--color-surface-input)' : 'transparent',
                  borderRadius: 6, marginBottom: 2,
                }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.type.startsWith('video/') ? '🎬 ' : '📷 '}
                    {f.name}
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)', marginLeft: 8, whiteSpace: 'nowrap' }}>
                    {formatSize(f.size)}
                  </span>
                  {!uploading && (
                    <button
                      onClick={() => removeFile(i)}
                      style={{
                        marginLeft: 6, background: 'none', border: 'none',
                        color: 'var(--color-danger)', cursor: 'pointer', padding: '2px 4px',
                      }}
                      aria-label={`移除 ${f.name}`}
                    >
                      <X size={14} weight="bold" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 上传按钮 */}
        <button
          className="btn-primary"
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          aria-busy={uploading}
          style={{ width: '100%', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          {uploading ? `上传中 (${doneCount}/${files.length})...` : <><UploadSimple size={18} /> 开始上传</>}
        </button>

        {/* 上传进度 */}
        {uploadStatus.length > 0 && uploading && (
          <div style={{ marginTop: 10 }}>
            {uploadStatus.map((s, i) => (
              <div key={i} style={{
                fontSize: 12, padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6,
                color: s.status === 'error' ? 'var(--color-danger)'
                  : s.status === 'done' ? 'var(--color-success)' : 'var(--color-text-secondary)',
              }}>
                <span>
                  {s.status === 'pending' ? '⏳' : s.status === 'uploading' ? '⬆️' : s.status === 'done' ? '✅' : '❌'}
                </span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.name}
                </span>
                <span>{s.status === 'done' ? '完成' : s.status === 'error' ? '失败' : '等待'}</span>
              </div>
            ))}
          </div>
        )}

        {/* 完成统计 */}
        {!uploading && uploadStatus.length > 0 && doneCount + errorCount > 0 && (
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            ✅ {doneCount} 个上传成功 {errorCount > 0 && `| ❌ ${errorCount} 个失败`}
          </div>
        )}
      </div>

      {/* 筛选栏 */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center',
      }}>
        <Faders size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
        <input
          type="date"
          className="input"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          aria-label="按日期筛选"
          style={{ flex: 1, fontSize: 13, padding: '6px 8px' }}
        />
        {filterDate && (
          <button
            onClick={() => setFilterDate('')}
            style={{
              background: 'none', border: 'none', color: 'var(--color-brand-emphasis)',
              cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap',
            }}
          >
            清除
          </button>
        )}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          aria-label="按类型筛选"
          style={{
            padding: '6px 8px', border: '1px solid var(--color-brand-subtle)',
            borderRadius: 8, fontSize: 13, background: 'var(--color-surface-input)',
            fontFamily: 'inherit', color: 'var(--color-text-primary)',
          }}
        >
          <option value="all">全部</option>
          <option value="image">📷 照片</option>
          <option value="video">🎬 视频</option>
        </select>
      </div>

      {/* 统计信息 */}
      {!loading && (
        <div style={{
          fontSize: 13, color: 'var(--color-text-secondary)',
          marginBottom: 12, display: 'flex', gap: 16,
        }}>
          <span>📷 {assets.filter((a) => a.file_type === 'image').length} 张照片</span>
          <span>🎬 {assets.filter((a) => a.file_type === 'video').length} 个视频</span>
          <span>📦 {formatSize(assets.reduce((sum, a) => sum + (a.file_size || 0), 0))}</span>
        </div>
      )}

      {/* 素材列表（按日期分组） */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>加载中...</div>
      ) : grouped.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <FolderOpen size={40} color="var(--color-brand-subtle)" style={{ marginBottom: 8 }} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>还没有素材，上传第一批吧</p>
        </div>
      ) : (
        grouped.map((group) => {
          const isCollapsed = collapsedDates[group.date]
          return (
            <div key={group.date} style={{ marginBottom: 16 }}>
              {/* 日期标题 */}
              <button
                onClick={() => toggleDateCollapse(group.date)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)',
                }}
              >
                {isCollapsed ? <CaretRight size={16} /> : <CaretDown size={16} />}
                {group.date}
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                  ({group.items.length} 个文件)
                </span>
              </button>

              {!isCollapsed && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: 10,
                }}>
                  {group.items.map((asset) => (
                    <div key={asset.id} style={{
                      background: 'var(--color-surface-card)',
                      borderRadius: 10,
                      boxShadow: 'var(--shadow-card)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}>
                      {/* 缩略图区域 */}
                      <div
                        onClick={() => openPreview(asset)}
                        style={{
                          width: '100%', height: 120, cursor: 'pointer',
                          background: '#f0f0f0', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          position: 'relative', overflow: 'hidden',
                        }}
                      >
                        {asset.file_type === 'image' ? (
                          <img
                            src={asset.public_url}
                            alt={asset.file_name}
                            loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            <Video size={32} weight="fill" />
                            <div style={{ fontSize: 10, marginTop: 4 }}>点击预览</div>
                          </div>
                        )}
                        {/* 类型角标 */}
                        <span style={{
                          position: 'absolute', top: 4, left: 4,
                          background: 'rgba(0,0,0,0.55)', color: '#fff',
                          borderRadius: 4, padding: '1px 6px', fontSize: 11,
                        }}>
                          {asset.file_type === 'video' ? '🎬' : '📷'}
                        </span>
                      </div>

                      {/* 信息区 */}
                      <div style={{ padding: '8px 10px', flex: 1 }}>
                        <div style={{
                          fontSize: 11, fontWeight: 500, marginBottom: 2,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }} title={asset.file_name}>
                          {asset.file_name}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
                          {asset.uploader_name} · {formatSize(asset.file_size)}
                        </div>
                        {asset.notes && (
                          <div style={{
                            fontSize: 10, color: 'var(--color-brand-emphasis)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            marginBottom: 6,
                          }} title={asset.notes}>
                            💬 {asset.notes}
                          </div>
                        )}
                      </div>

                      {/* 操作按钮 */}
                      <div style={{
                        display: 'flex', borderTop: '1px solid var(--color-brand-subtle)',
                      }}>
                        <button
                          onClick={() => handleDownload(asset)}
                          aria-label={`下载 ${asset.file_name}`}
                          title="下载"
                          style={{
                            flex: 1, padding: '8px 0', background: 'none', border: 'none',
                            borderRight: '1px solid var(--color-brand-subtle)',
                            cursor: 'pointer', color: 'var(--color-brand-primary)',
                            fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                          }}
                        >
                          <DownloadSimple size={16} /> 下载
                        </button>
                        <button
                          onClick={() => handleDelete(asset)}
                          aria-label={`删除 ${asset.file_name}`}
                          title="删除"
                          style={{
                            padding: '8px 10px', background: 'none', border: 'none',
                            cursor: 'pointer', color: 'var(--color-text-secondary)',
                            fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}

      {/* 全屏预览 */}
      {preview && (
        <div
          style={lightboxOverlay}
          onClick={closePreview}
          role="dialog"
          aria-modal="true"
          aria-label="素材预览"
        >
          {/* 顶部工具栏 */}
          <div style={lightboxToolbar}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              {preview.asset?.file_name}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleDownload(preview.asset)}
                style={lightboxBtn}
                aria-label="下载"
              >
                <DownloadSimple size={20} />
              </button>
              <button
                onClick={() => handleDelete(preview.asset)}
                style={{ ...lightboxBtn, color: 'var(--color-danger)' }}
                aria-label="删除"
              >
                <Trash size={20} />
              </button>
              <button onClick={closePreview} style={lightboxBtn} aria-label="关闭">
                <X size={24} />
              </button>
            </div>
          </div>

          {/* 内容 */}
          <div style={lightboxContent} onClick={(e) => e.stopPropagation()}>
            {preview.type === 'image' ? (
              <img
                src={preview.url}
                alt={preview.asset?.file_name}
                style={{
                  maxWidth: '90vw', maxHeight: '80vh',
                  borderRadius: 8, objectFit: 'contain',
                }}
              />
            ) : (
              <video
                src={preview.url}
                controls
                autoPlay
                style={{
                  maxWidth: '90vw', maxHeight: '80vh',
                  borderRadius: 8, background: '#000',
                }}
              />
            )}
          </div>

          {/* 底部信息 */}
          {preview.asset && (
            <div style={lightboxInfo}>
              <span>{preview.asset.uploader_name}</span>
              <span>{preview.asset.asset_date}</span>
              <span>{formatSize(preview.asset.file_size)}</span>
              {preview.asset.notes && <span>💬 {preview.asset.notes}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const labelStyle = {
  fontSize: 13, fontWeight: 500,
  color: 'var(--color-text-secondary)',
  marginBottom: 4, display: 'block',
}

const lightboxOverlay = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.92)', zIndex: 300,
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
}

const lightboxToolbar = {
  position: 'absolute', top: 0, left: 0, right: 0,
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '12px 16px', color: '#fff',
}

const lightboxContent = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const lightboxInfo = {
  position: 'absolute', bottom: 0, left: 0, right: 0,
  display: 'flex', gap: 16, justifyContent: 'center',
  padding: '12px 16px', color: 'rgba(255,255,255,0.7)',
  fontSize: 13, flexWrap: 'wrap',
}

const lightboxBtn = {
  background: 'none', border: 'none', color: '#fff',
  cursor: 'pointer', padding: 4, display: 'flex',
}
