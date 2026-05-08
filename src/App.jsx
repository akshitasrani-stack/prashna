import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import './App.css'

const ALL_TOPICS = [
  "Probability",
  "Permutation & Combination",
  "Circular Arrangement",
  "Circles",
  "Geometry",
  "Arithmetic",
  "Algebra",
  "Number Theory",
  "Time & Work",
  "Time, Speed & Distance",
  "Percentages",
  "Profit & Loss",
  "Simple & Compound Interest",
  "Sequences & Series",
  "Quadratic Equations",
  "Functions",
  "Logarithms",
  "Trigonometry",
  "Mensuration",
  "Coordinate Geometry",
  "Set Theory",
  "Mixtures & Alligations",
  "Indices and Surds",
  "Equations",
]

function SearchBar({ onSelectTopic, selectedTopic, onClear }) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])

  function handleInput(e) {
    const val = e.target.value
    setInput(val)
    if (val.length < 2) {
      setSuggestions([])
      return
    }
    const matches = ALL_TOPICS.filter(t =>
      t.toLowerCase().includes(val.toLowerCase())
    )
    setSuggestions(matches)
  }

  function handleSelect(topic) {
    onSelectTopic(topic)
    setInput(topic)
    setSuggestions([])
  }

  function handleClear() {
    setInput('')
    setSuggestions([])
    onClear()
  }

  return (
    <div className="search-wrap">
      <input
        className="search-input"
        type="text"
        placeholder="Type a topic — e.g. Probability, Geometry, Circles..."
        value={selectedTopic || input}
        onChange={handleInput}
        onFocus={() => selectedTopic && handleClear()}
      />
      {selectedTopic && (
        <button className="clear-btn" onClick={handleClear}>✕</button>
      )}
      {suggestions.length > 0 && !selectedTopic && (
        <div className="suggestions-dropdown">
          {suggestions.map(topic => (
            <div
              key={topic}
              className="suggestion-item"
              onClick={() => handleSelect(topic)}
            >
              {topic}
            </div>
          ))}
        </div>
      )}
      {input.length >= 2 && suggestions.length === 0 && !selectedTopic && (
        <div className="suggestions-dropdown">
          <div className="no-suggestion">
            No matching topic — try: Probability, Geometry, Algebra
          </div>
        </div>
      )}
    </div>
  )
}

function QuestionCard({ question }) {
  const [expanded, setExpanded] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [attempted, setAttempted] = useState(null)

  function handleAttempt(type) {
    setAttempted(type)
  }

  return (
    <div className="q-card expanded">
  <div className="q-card-top">
        <div className="q-year-badge">
          Slot {question.slot}
        </div>
        <div className="q-content">
          <p className="q-text">{question.question_text}</p>
          <div className="q-tags">
            <span className="q-tag topic">{question.topic}</span>
            <span className="q-tag subtopic">{question.subtopic}</span>
            <span className={`q-tag diff-${question.difficulty?.toLowerCase()}`}>
              {question.difficulty}
            </span>
            <span className="q-tag type">{question.question_type}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="q-expanded-body" onClick={e => e.stopPropagation()}>
          {question.option_a && (
            <div className="options-grid">
              {[question.option_a, question.option_b, question.option_c, question.option_d]
                .filter(Boolean)
                .map((opt, i) => (
                  <div
                    key={i}
                    className={`option ${
                      showAnswer && i === question.correct ? 'correct' :
                      showAnswer && i === selected && i !== question.correct ? 'wrong' :
                      selected === i && !showAnswer ? 'selected' : ''
                    }`}
                    onClick={() => !showAnswer && setSelected(i)}
                  >
                    <span className="opt-label">{['A','B','C','D'][i]}</span>
                    {opt}
                  </div>
                ))}
            </div>
          )}

          {question.question_type === 'TITA' && (
            <input
              className="tita-input"
              type="text"
              placeholder="Enter your answer (TITA — type your answer)"
            />
          )}

          {!showAnswer && (
            <button
              className="show-answer-btn"
              onClick={() => setShowAnswer(true)}
            >
              Show Answer & Solution
            </button>
          )}

          {showAnswer && (
            <div className={`solution-box ${selected !== null && selected !== question.correct ? 'incorrect' : ''}`}>
              <div className="solution-label">
                {selected !== null && selected !== question.correct
                  ? '✗ Incorrect — See Solution'
                  : '✓ Solution'}
              </div>
              <div className="solution-text">
                {question.solution?.split('. ').map((sentence, i) => (
                  sentence.trim() && <p key={i}>{sentence.trim()}.</p>
                ))}
              </div>
            </div>
          )}

          {showAnswer && !attempted && (
            <div className="attempt-section">
              <div className="attempt-label">Mark your attempt</div>
              <div className="attempt-btns">
                <button className="attempt-btn right" onClick={() => handleAttempt('right')}>
                  ✓ Got it right
                </button>
                <button className="attempt-btn wrong-btn" onClick={() => handleAttempt('wrong')}>
                  ✗ Got it wrong
                </button>
                <button className="attempt-btn skip" onClick={() => handleAttempt('skip')}>
                  — Skipped
                </button>
              </div>
            </div>
          )}

          {attempted && (
            <div className={`attempt-result ${attempted}`}>
              {attempted === 'right' && '✓ Logged as correct'}
              {attempted === 'wrong' && '✗ Logged — this will show in your weakness report'}
              {attempted === 'skip' && '— Skipped'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function YearGroup({ year, questions, isRecent }) {
  const [open, setOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  return (
    <div className="year-group">
      <div className="year-group-header" onClick={() => setOpen(!open)}>
        <div className="year-group-left">
          <span className="year-label">CAT {year}</span>
          {isRecent && <span className="recent-badge">Recent</span>}
          <span className="year-count">{questions.length} questions</span>
        </div>
        <span className={`year-chevron ${open ? 'open' : ''}`}>▼</span>
      </div>

      {open && isRecent && !confirmed && (
        <div className="year-gate">
          <div className="year-gate-inner">
            <span className="year-gate-icon">⚠️</span>
            <div className="year-gate-content">
              <div className="year-gate-title">CAT {year} — Recent Paper</div>
              <div className="year-gate-msg">
                We recommend saving recent papers for full mock tests.
                Seeing questions beforehand reduces their simulation value.
              </div>
              <div className="gate-btns">
                <button
                  className="gate-btn primary"
                  onClick={e => { e.stopPropagation(); setConfirmed(true) }}
                >
                  Continue Anyway
                </button>
                <button
                  className="gate-btn secondary"
                  onClick={e => { e.stopPropagation(); setOpen(false) }}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {open && (!isRecent || confirmed) && (
        <div className="year-group-questions">
          {questions.map(q => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  )
}

function YearGroups({ questions }) {
  const currentYear = new Date().getFullYear()
  const lastCATYear = currentYear - 1

  const grouped = questions.reduce((acc, q) => {
    const yr = q.year
    if (!acc[yr]) acc[yr] = []
    acc[yr].push(q)
    return acc
  }, {})

  const years = Object.keys(grouped).sort((a, b) => b - a)

  return (
    <div className="year-groups">
      {years.map(year => (
        <YearGroup
          key={year}
          year={parseInt(year)}
          questions={grouped[year]}
          isRecent={parseInt(year) >= lastCATYear - 1}
        />
      ))}
    </div>
  )
}

function App() {
  const [selectedTopic, setSelectedTopic] = useState('')
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuestions()
  }, [selectedTopic])

  async function fetchQuestions() {
    setLoading(true)

    let query = supabase
      .from('questions')
      .select('*')
      .eq('exam', 'CAT')
      .eq('section', 'QA')

    if (selectedTopic) {
      query = query.or(`topic.eq.${selectedTopic},subtopic.eq.${selectedTopic}`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching:', error)
    } else {
      setQuestions(data)
    }

    setLoading(false)
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">प्र<span>shna</span></div>
        <button className="nav-cta">Sign In</button>
      </nav>

      <main className="main">
        <p className="hero-label">CAT · 2000 – 2024 · 2,400+ Questions</p>
        <h1 className="hero-title">
          Search every question<br/>ever asked in CAT.
        </h1>
        <p className="hero-sub">
          By topic, concept, year, or keyword. Instantly.
        </p>

        <SearchBar
          onSelectTopic={setSelectedTopic}
          selectedTopic={selectedTopic}
          onClear={() => setSelectedTopic('')}
        />

        <div className="results-meta">
          <div className="results-count">
            {selectedTopic
              ? <><span>{questions.length}</span> questions on <span>{selectedTopic}</span></>
              : <><span>{questions.length}</span> questions — select a topic to filter</>
            }
          </div>
        </div>

        <div className="questions-list">
          {loading ? (
            <div className="loading-state">Fetching questions...</div>
          ) : questions.length === 0 ? (
            <div className="empty-state">No questions found for this topic yet.</div>
          ) : (
            <YearGroups questions={questions} />
          )}
        </div>
      </main>
    </div>
  )
}

export default App