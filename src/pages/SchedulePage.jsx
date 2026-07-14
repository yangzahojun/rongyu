import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Gear, CaretLeft, CaretRight, X, ChartBar } from '@phosphor-icons/react'
import CourseModal from '../components/CourseModal'
import ObservationModal from '../components/ObservationModal'

function getWeekDates(baseDate) {
  const monday = new Date(baseDate)
  const day = monday.getDay()
  const diff = day === 0 ? -6 : 1 - day
  monday.setDate(monday.getDate() + diff)
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const month = d.getMonth() + 1
  const day = d.getDate()
  const wd = weekdays[d.getDay()]
  return `${month}/${day} ${wd}`
}

const GRADES = ['高一', '高二', '高三']
const TAB_TEACHING = 'teaching'
const TAB_OBSERVATION = 'observation'

export default function SchedulePage() {
  const [classes, setClasses] = useState([])
  const [courses, setCourses] = useState([])
  const [observations, setObservations] = useState([])
  const [stats, setStats] = useState([])
  const [weekDates, setWeekDates] = useState(() => getWeekDates(new Date()))
  const [courseModal, setCourseModal] = useState(null)
  const [obsModal, setObsModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showClassMgr, setShowClassMgr] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newClassGrade, setNewClassGrade] = useState('高一')
  const [activeTab, setActiveTab] = useState(TAB_TEACHING)

  useEffect(() => {
    fetchClasses()
    fetchAll()
  }, [])

  useEffect(() => {
    fetchAll()
  }, [weekDates])

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('*').order('id')
    if (data) setClasses(data)
  }

  const fetchAll = async () => {
    setLoading(true)
    const startDate = weekDates[0]
    const endDate = weekDates[6]

    const [{ data: courseData }, { data: obsData }] = await Promise.all([
      supabase.from('courses').select('*').gte('course_date', startDate).lte('course_date', endDate),
      supabase.from('observations').select('*').gte('observation_date', startDate).lte('observation_date', endDate),
    ])

    if (courseData) setCourses(courseData)
    if (obsData) setObservations(obsData)
    setLoading(false)

    // 同时拉取全局统计（不依赖日期范围）
    fetchStats()
  }

  const fetchStats = async () => {
    const [{ data: allCourses }, { data: allObs }] = await Promise.all([
      supabase.from('courses').select('teacher_name'),
      supabase.from('observations').select('observer_name'),
    ])

    const teacherMap = {}
    if (allCourses) {
      for (const c of allCourses) {
        if (!teacherMap[c.teacher_name]) teacherMap[c.teacher_name] = { name: c.teacher_name, teaching: 0, observing: 0 }
        teacherMap[c.teacher_name].teaching++
      }
    }
    if (allObs) {
      for (const o of allObs) {
        if (!teacherMap[o.observer_name]) teacherMap[o.observer_name] = { name: o.observer_name, teaching: 0, observing: 0 }
        teacherMap[o.observer_name].observing++
      }
    }

    const sorted = Object.values(teacherMap).sort((a, b) => (b.teaching + b.observing) - (a.teaching + a.observing))
    setStats(sorted)
  }

  const addClass = async () => {
    if (!newClassName.trim()) return
    await supabase.from('classes').insert({ name: newClassName.trim(), grade: newClassGrade })
    setNewClassName('')
    fetchClasses()
  }

  const deleteClass = async (id) => {
    await supabase.from('classes').delete().eq('id', id)
    fetchClasses()
  }

  const getCourses = (classId, date) => {
    return courses.filter((c) => c.class_id === classId && c.course_date === date)
  }

  const getObservations = (classId, date) => {
    return observations.filter((o) => o.class_id === classId && o.observation_date === date)
  }

  const openCourseModal = (classData, date) => {
    const existing = getCourses(classData.id, date)
    setCourseModal({ classData, date, existingCourses: existing })
  }

  const openObsModal = (classData, date) => {
    const existing = getObservations(classData.id, date)
    setObsModal({ classData, date, existingObservations: existing })
  }

  const closeCourseModal = () => setCourseModal(null)
  const closeObsModal = () => setObsModal(null)

  const handleCoursesSaved = () => {
    fetchAll()
    closeCourseModal()
  }

  const handleObsSaved = () => {
    fetchAll()
    closeObsModal()
  }

  const prevWeek = () => {
    const d = new Date(weekDates[0])
    d.setDate(d.getDate() - 7)
    setWeekDates(getWeekDates(d))
  }

  const nextWeek = () => {
    const d = new Date(weekDates[0])
    d.setDate(d.getDate() + 7)
    setWeekDates(getWeekDates(d))
  }

  const goThisWeek = () => {
    setWeekDates(getWeekDates(new Date()))
  }

  const computedMinWidth = `${classes.length * 90 + 70}px`

  // ---- 渲染 ----
  return (
    <div className="page-content">
      {/* 周导航 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <button className="btn-outline" onClick={prevWeek} aria-label="上一周" style={{ padding: '6px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
          <CaretLeft size={16} /> 上周
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>
            {weekDates[0]} ~ {weekDates[6]}
          </div>
          <button
            onClick={goThisWeek}
            aria-label="回到本周"
            style={{
              fontSize: 12, color: 'var(--color-brand-emphasis)', background: 'none',
              border: 'none', cursor: 'pointer', marginTop: 2,
            }}
          >
            回到本周
          </button>
        </div>
        <button className="btn-outline" onClick={nextWeek} aria-label="下一周" style={{ padding: '6px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
          下周 <CaretRight size={16} />
        </button>
      </div>

      {/* Tab 切换：授课排班 / 听课排班 */}
      <div style={{
        display: 'flex',
        background: 'var(--color-surface-primary)',
        borderRadius: 10,
        padding: 3,
        marginBottom: 12,
      }}>
        {[
          { key: TAB_TEACHING, label: '📖 授课排班' },
          { key: TAB_OBSERVATION, label: '👀 听课排班' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            aria-pressed={activeTab === tab.key}
            style={{
              flex: 1,
              padding: '8px 0',
              fontSize: 14,
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? 'var(--color-brand-emphasis)' : 'var(--color-text-secondary)',
              background: activeTab === tab.key ? 'var(--color-surface-card)' : 'transparent',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              boxShadow: activeTab === tab.key ? 'var(--shadow-card)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 班级管理按钮 */}
      <div style={{ marginBottom: 12, textAlign: 'right' }}>
        <button
          className="btn-outline"
          onClick={() => setShowClassMgr(!showClassMgr)}
          aria-expanded={showClassMgr}
          aria-label={showClassMgr ? '收起班级管理' : '管理班级'}
          style={{ padding: '6px 14px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <Gear size={16} /> {showClassMgr ? '收起' : '管理班级'}
        </button>
      </div>

      {/* 班级管理面板 */}
      {showClassMgr && (
        <div className="card" style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>班级管理</h3>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <select
              value={newClassGrade}
              onChange={(e) => setNewClassGrade(e.target.value)}
              aria-label="选择年级"
              style={{
                padding: '8px 10px', border: '1px solid var(--color-brand-subtle)',
                borderRadius: 8, fontSize: 13, background: 'var(--color-surface-input)', fontFamily: 'inherit',
              }}
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <label htmlFor="new-class-name" className="sr-only">班级名称</label>
            <input
              id="new-class-name"
              className="input"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="如：1班"
              style={{ flex: 1 }}
              onKeyDown={(e) => e.key === 'Enter' && addClass()}
            />
            <button className="btn-primary" onClick={addClass} style={{ padding: '8px 14px', fontSize: 13 }}>
              添加
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {classes.map((cls) => (
              <div key={cls.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--color-surface-primary)',
                borderRadius: 8,
                padding: '4px 8px 4px 12px',
                fontSize: 13,
              }}>
                <span>{cls.name}</span>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>({cls.grade})</span>
                <button
                  onClick={() => deleteClass(cls.id)}
                  aria-label={`删除${cls.name}`}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-danger)', fontSize: 16, lineHeight: 1, padding: '0 4px',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <X size={16} weight="bold" />
                </button>
              </div>
            ))}
          </div>
          {classes.length === 0 && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>还没有班级，添加第一个吧</p>
          )}
        </div>
      )}

      {/* 排班表网格 */}
      <div style={{
        background: 'var(--color-surface-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>
            加载中...
          </div>
        ) : classes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)', fontSize: 14 }}>
            <p>还没有班级数据</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>
              点击上方"管理班级"按钮来添加班级
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ ...tableStyleBase, minWidth: computedMinWidth }}>
              <thead>
                <tr>
                  <th style={thStyle}>日期</th>
                  {classes.map((cls) => (
                    <th key={cls.id} style={thStyle}>{cls.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekDates.map((date) => (
                  <tr key={date}>
                    <td style={dateTdStyle}>{formatDateLabel(date)}</td>
                    {classes.map((cls) => {
                      if (activeTab === TAB_TEACHING) {
                        const cellCourses = getCourses(cls.id, date)
                        return (
                          <td
                            key={cls.id}
                            style={{
                              ...cellStyle,
                              height: cellCourses.length > 2 ? 'auto' : 56,
                            }}
                            onClick={() => openCourseModal(cls, date)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCourseModal(cls, date) } }}
                            role="button"
                            tabIndex={0}
                            aria-label={`${formatDateLabel(date)} ${cls.name} - ${cellCourses.length ? '查看课程' : '点击添加课程'}`}
                          >
                            {cellCourses.length === 0 ? (
                              <span style={addHintStyle}>+</span>
                            ) : (
                              <div>
                                {cellCourses.slice(0, 3).map((c) => (
                                  <div key={c.id} style={{
                                    fontSize: 11, fontWeight: 500,
                                    background: 'var(--color-surface-primary)', borderRadius: 4,
                                    padding: '1px 4px', margin: '1px 0',
                                    lineHeight: 1.4,
                                  }}>
                                    {c.course_name}
                                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400, marginLeft: 2 }}>
                                      {c.teacher_name}
                                    </span>
                                  </div>
                                ))}
                                {cellCourses.length > 3 && (
                                  <div style={{ fontSize: 10, color: 'var(--color-brand-emphasis)', marginTop: 1 }}>
                                    +{cellCourses.length - 3} 更多
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        )
                      }

                      // 听课排班 Tab
                      const cellObs = getObservations(cls.id, date)
                      return (
                        <td
                          key={cls.id}
                          style={{
                            ...cellStyle,
                            height: cellObs.length > 2 ? 'auto' : 56,
                          }}
                          onClick={() => openObsModal(cls, date)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openObsModal(cls, date) } }}
                          role="button"
                          tabIndex={0}
                          aria-label={`${formatDateLabel(date)} ${cls.name} - ${cellObs.length ? '查看听课' : '点击添加听课'}`}
                        >
                          {cellObs.length === 0 ? (
                            <span style={addHintStyle}>+</span>
                          ) : (
                            <div>
                              {cellObs.slice(0, 3).map((o) => (
                                <div key={o.id} style={{
                                  fontSize: 11, fontWeight: 500,
                                  background: '#E8F5E9', borderRadius: 4,
                                  padding: '1px 4px', margin: '1px 0',
                                  lineHeight: 1.4, color: '#2E7D32',
                                }}>
                                  👂 {o.observer_name}
                                </div>
                              ))}
                              {cellObs.length > 3 && (
                                <div style={{ fontSize: 10, color: 'var(--color-brand-emphasis)', marginTop: 1 }}>
                                  +{cellObs.length - 3} 更多
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 课时统计面板 */}
      <div style={{ marginTop: 16 }}>
        <button
          className="btn-outline"
          onClick={() => setShowStats(!showStats)}
          aria-expanded={showStats}
          aria-label={showStats ? '收起统计' : '查看课时统计'}
          style={{
            width: '100%', padding: '10px 0', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <ChartBar size={18} /> {showStats ? '收起统计' : '📊 课时统计'}
        </button>

        {showStats && (
          <div className="card" style={{ marginTop: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>队员课时汇总</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-brand-primary)' }}>
                    <th style={{ padding: '8px 6px', textAlign: 'left', fontSize: 12, fontWeight: 600 }}>姓名</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center', fontSize: 12, fontWeight: 600 }}>授课</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center', fontSize: 12, fontWeight: 600 }}>听课</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center', fontSize: 12, fontWeight: 600 }}>总计</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s, i) => (
                    <tr key={s.name} style={{
                      borderBottom: '1px solid var(--color-brand-subtle)',
                      background: i % 2 === 0 ? 'transparent' : 'var(--color-surface-primary)',
                    }}>
                      <td style={{ padding: '7px 6px', fontWeight: 500 }}>{s.name}</td>
                      <td style={{ padding: '7px 6px', textAlign: 'center' }}>{s.teaching}</td>
                      <td style={{ padding: '7px 6px', textAlign: 'center' }}>{s.observing}</td>
                      <td style={{ padding: '7px 6px', textAlign: 'center', fontWeight: 600, color: 'var(--color-brand-emphasis)' }}>
                        {s.teaching + s.observing}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {courseModal && (
        <CourseModal
          classData={courseModal.classData}
          date={courseModal.date}
          existingCourses={courseModal.existingCourses}
          onClose={closeCourseModal}
          onSaved={handleCoursesSaved}
        />
      )}

      {obsModal && (
        <ObservationModal
          classData={obsModal.classData}
          date={obsModal.date}
          existingObservations={obsModal.existingObservations}
          onClose={closeObsModal}
          onSaved={handleObsSaved}
        />
      )}
    </div>
  )
}

const tableStyleBase = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
}

const thStyle = {
  padding: '10px 6px',
  background: 'var(--color-surface-primary)',
  fontWeight: 600,
  fontSize: 12,
  whiteSpace: 'nowrap',
  position: 'sticky',
  top: 0,
  borderBottom: '2px solid var(--color-brand-primary)',
}

const dateTdStyle = {
  padding: '8px 6px',
  borderBottom: '1px solid var(--color-brand-subtle)',
  fontSize: 11,
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
  fontWeight: 500,
  background: 'var(--color-surface-input)',
}

const cellStyle = {
  padding: 4,
  borderBottom: '1px solid var(--color-brand-subtle)',
  borderLeft: '1px solid var(--color-brand-subtle)',
  textAlign: 'center',
  cursor: 'pointer',
  minWidth: 80,
  transition: 'background 0.15s',
  verticalAlign: 'top',
}

const addHintStyle = {
  color: 'var(--color-text-secondary)',
  fontSize: 18,
  fontWeight: 300,
  opacity: 0.5,
}
