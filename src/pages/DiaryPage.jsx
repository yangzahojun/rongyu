import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { PencilSimple, BookOpen, Image, Video, PaperPlaneTilt, X } from '@phosphor-icons/react'
import DiaryCard from '../components/DiaryCard'

export default function DiaryPage() {
  const [diaries, setDiaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [authorName, setAuthorName] = useState('')
  const [diaryDate, setDiaryDate] = useState(() => new Date().toISOString().split('T')[0])
  const [contentText, setContentText] = useState('')
  const [images, setImages] = useState([])
  const [video, setVideo] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)

  useEffect(() => {
    fetchDiaries()
  }, [])

  const fetchDiaries = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('diaries')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setDiaries(data)
    setLoading(false)
  }

  const uploadFile = async (file, folder) => {
    const ext = file.name.split('.').pop()
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from('diary-media').upload(path, file)
    if (error) throw error
    const { data: urlData } = supabase.storage.from('diary-media').getPublicUrl(path)
    return urlData.publicUrl
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    setImages((prev) => [...prev, ...files])
  }

  const handleVideoSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.size > 50 * 1024 * 1024) {
      alert('视频文件不能超过 50MB')
      return
    }
    setVideo(file)
  }

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!authorName.trim()) {
      alert('请填写你的名字')
      return
    }

    setSaving(true)
    try {
      const imageUrls = []
      for (const img of images) {
        const url = await uploadFile(img, 'images')
        imageUrls.push(url)
      }

      let videoUrls = []
      if (video) {
        const url = await uploadFile(video, 'videos')
        videoUrls.push(url)
      }

      const { error } = await supabase.from('diaries').insert({
        author_name: authorName.trim(),
        diary_date: diaryDate,
        content_text: contentText.trim(),
        image_urls: imageUrls,
        video_urls: videoUrls,
      })

      if (error) throw error

      setContentText('')
      setImages([])
      setVideo(null)
      setShowForm(false)
      fetchDiaries()
    } catch (err) {
      console.error('发布失败:', err)
      alert('发布失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-content">
      {!showForm && (
        <button
          className="btn-primary"
          onClick={() => setShowForm(true)}
          style={{ width: '100%', marginBottom: 16, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <PencilSimple size={18} /> 写一篇日记
        </button>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <PencilSimple size={18} /> 写日记
          </h3>

          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle} htmlFor="diary-author-name">你的名字</label>
              <input
                id="diary-author-name"
                className="input"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="输入你的名字"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle} htmlFor="diary-date">日期</label>
              <input
                id="diary-date"
                type="date"
                className="input"
                value={diaryDate}
                onChange={(e) => setDiaryDate(e.target.value)}
              />
            </div>
          </div>

          <label style={labelStyle} htmlFor="diary-content">日记内容</label>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <div style={{
              position: 'absolute', right: -8, top: -40, zIndex: 5,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <img src="xiaowan.png" alt="小弯" className="xiaowan-buddy"
                style={{ height: 36, marginBottom: -2 }} />
              <span className="sakura-petal" style={{ position: 'relative' }} aria-hidden="true">&#x1F338;</span>
              <span className="sakura-petal" style={{ position: 'relative' }} aria-hidden="true">&#x1F338;</span>
              <span className="sakura-petal" style={{ position: 'relative' }} aria-hidden="true">&#x1F338;</span>
            </div>
            <textarea
              id="diary-content"
              className="input"
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder="记录今天的支教点滴..."
              style={{ paddingRight: 50 }}
            />
          </div>

          <label style={labelStyle}>
            <Image size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
            图片（可多选）
          </label>
          {images.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {images.map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`待上传图片 ${i + 1}`}
                    style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover' }}
                  />
                  <button
                    onClick={() => removeImage(i)}
                    aria-label={`移除图片 ${i + 1}`}
                    style={{
                      position: 'absolute', top: -4, right: -4,
                      background: 'var(--color-danger)', color: '#fff',
                      border: 'none', borderRadius: '50%',
                      width: 20, height: 20, fontSize: 12,
                      cursor: 'pointer', lineHeight: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <X size={12} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            style={{ display: 'none' }}
            id="image-upload"
          />
          <button
            className="btn-outline"
            onClick={() => imageInputRef.current?.click()}
            style={{ marginBottom: 12, fontSize: 13 }}
          >
            选择图片
          </button>

          <label style={labelStyle}>
            <Video size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
            视频（选填，限50MB）
          </label>
          {video && (
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              已选择: {video.name}
              <button
                onClick={() => setVideo(null)}
                style={{
                  marginLeft: 8, background: 'none', border: 'none',
                  color: 'var(--color-danger)', cursor: 'pointer', fontSize: 13,
                }}
              >
                移除
              </button>
            </div>
          )}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoSelect}
            style={{ display: 'none' }}
            id="video-upload"
          />
          <button
            className="btn-outline"
            onClick={() => videoInputRef.current?.click()}
            style={{ marginBottom: 16, fontSize: 13 }}
          >
            选择视频
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={saving}
              aria-busy={saving}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {saving ? '发布中...' : <><PaperPlaneTilt size={16} /> 发布日记</>}
            </button>
            <button
              className="btn-outline"
              onClick={() => setShowForm(false)}
            >
              取消
            </button>
          </div>
        </div>
      )}

      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <BookOpen size={18} weight="fill" style={{ color: 'var(--color-brand-primary)' }} />
        队员日记
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>
          加载中...
        </div>
      ) : diaries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <BookOpen size={36} color="var(--color-brand-subtle)" style={{ marginBottom: 8 }} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
            还没有日记，点击上方按钮写第一篇吧
          </p>
        </div>
      ) : (
        diaries.map((diary) => (
          <DiaryCard
            key={diary.id}
            diary={diary}
            onEdit={async (id, newText) => {
              await supabase.from('diaries').update({ content_text: newText }).eq('id', id)
              fetchDiaries()
            }}
            onDelete={async (id) => {
              await supabase.from('diaries').delete().eq('id', id)
              fetchDiaries()
            }}
          />
        ))
      )}
    </div>
  )
}

const labelStyle = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  marginBottom: 4,
  display: 'block',
}
