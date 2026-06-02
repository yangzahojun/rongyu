import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Image } from '@phosphor-icons/react'

export default function ShowcasePage() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  useEffect(() => {
    fetchPhotos()

    const onKey = (e) => { if (e.key === 'Escape') setSelectedPhoto(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const fetchPhotos = async () => {
    setLoading(true)
    const { data: diaries } = await supabase
      .from('diaries')
      .select('*')
      .not('image_urls', 'eq', '{}')
      .order('created_at', { ascending: false })

    if (diaries) {
      const allPhotos = []
      diaries.forEach((diary) => {
        if (diary.image_urls && diary.image_urls.length > 0) {
          diary.image_urls.forEach((url) => {
            allPhotos.push({
              url,
              author: diary.author_name,
              date: diary.diary_date,
              text: diary.content_text?.slice(0, 100) || '',
              diaryId: diary.id,
            })
          })
        }
      })
      setPhotos(allPhotos)
    }
    setLoading(false)
  }

  return (
    <div className="page-content">
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Image size={22} weight="fill" style={{ color: 'var(--color-brand-primary)' }} />
          风采展示
        </h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          队员们分享的精彩瞬间
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>
          加载中...
        </div>
      ) : photos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Image size={48} color="var(--color-brand-subtle)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, marginBottom: 4 }}>
            还没有风采瞬间
          </p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
            去「写日记」上传图片，照片会自动展示在这里
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 8,
        }}>
          {photos.map((photo, i) => (
            <div
              key={i}
              onClick={() => setSelectedPhoto(photo)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPhoto(photo) } }}
              role="button"
              tabIndex={0}
              aria-label={`${photo.author}拍摄于${photo.date}`}
              style={{
                borderRadius: 10,
                overflow: 'hidden',
                cursor: 'pointer',
                aspectRatio: '1',
                boxShadow: '0 2px 8px rgba(255, 182, 193, 0.2)',
              }}
            >
              <img
                src={photo.url}
                alt={`${photo.author}的照片`}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {selectedPhoto && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 300,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setSelectedPhoto(null)}
          role="dialog"
          aria-modal="true"
          aria-label="照片详情"
        >
          <img
            src={selectedPhoto.url}
            alt={`${selectedPhoto.author}的照片`}
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              borderRadius: 12,
              objectFit: 'contain',
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <div style={{
            color: '#FFF',
            textAlign: 'center',
            marginTop: 16,
          }}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>
              <span aria-hidden="true">&#x1F338; </span>
              {selectedPhoto.author}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
              {selectedPhoto.date}
            </div>
            {selectedPhoto.text && (
              <p style={{ fontSize: 13, opacity: 0.9, maxWidth: 320, lineHeight: 1.5 }}>
                {selectedPhoto.text}
              </p>
            )}
          </div>
          <button
            onClick={() => setSelectedPhoto(null)}
            aria-label="关闭照片详情"
            style={{
              marginTop: 16, background: 'rgba(255,255,255,0.2)',
              border: 'none', borderRadius: 20, padding: '8px 24px',
              color: '#FFF', fontSize: 14, cursor: 'pointer',
            }}
          >
            关闭
          </button>
        </div>
      )}
    </div>
  )
}
