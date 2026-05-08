import { useState } from 'react'
import { supabase } from './supabase'
import Anthropic from '@anthropic-ai/sdk'
import './Admin.css'

const client = new Anthropic({
  apiKey: 'YOUR_ANTHROPIC_API_KEY_HERE',
  dangerouslyAllowBrowser: true
})

const EXTRACTION_PROMPT = `You are a CAT exam question extractor.

Extract every Quantitative Aptitude question from this paper and return a JSON array only. No explanation, no preamble, just the raw JSON array.

For each question output exactly this structure:
{
  "year": YEAR,
  "slot": SLOT,
  "exam": "CAT",
  "section": "QA",
  "question_text": "full question text here",
  "option_a": "option text or null if TITA",
  "option_b": "option text or null if TITA",
  "option_c": "option text or null if TITA",
  "option_d": "option text or null if TITA",
  "correct": 0,
  "question_type": "MCQ or TITA",
  "topic": "one of: Arithmetic / Algebra / Geometry / Number Theory / Permutation & Combination / Probability / Modern Math",
  "subtopic": "specific subtopic",
  "concept": "core concept being tested in one phrase",
  "difficulty": "Easy or Medium or Hard",
  "solution": "step by step solution"
}

Important:
- correct is 0 for A, 1 for B, 2 for C, 3 for D, null for TITA
- QA section only
- Return only the JSON array, nothing else`

function Admin() {
  const [file, setFile] = useState(null)
  const [year, setYear] = useState('2023')
  const [slot, setSlot] = useState('1')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState([])

  function handleFile(e) {
    setFile(e.target.files[0])
    setStatus('')
    setQuestions([])
  }

  async function processFile() {
    if (!file) {
      setStatus('Please select a PDF file first')
      return
    }

    setLoading(true)
    setStatus('Reading PDF...')

    try {
      // Convert PDF to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      setStatus('Sending to Claude for extraction...')

      // Send to Claude API
      const prompt = EXTRACTION_PROMPT
        .replace('YEAR', year)
        .replace('SLOT', slot)

      const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      })

      setStatus('Parsing questions...')

      // Parse the JSON response
      const raw = response.content[0].text
      const clean = raw.replace(/```json|```/g, '').trim()
      const extracted = JSON.parse(clean)

      setQuestions(extracted)
      setStatus(`✓ Extracted ${extracted.length} questions. Ready to insert.`)

    } catch (err) {
      console.error(err)
      setStatus('Error: ' + err.message)
    }

    setLoading(false)
  }

  async function insertToDatabase() {
    if (questions.length === 0) return

    setLoading(true)
    setStatus('Inserting into database...')

    const { error } = await supabase
      .from('questions')
      .insert(questions)

    if (error) {
      setStatus('Insert error: ' + error.message)
    } else {
      setStatus(`✓ Successfully added ${questions.length} questions to database!`)
      setQuestions([])
      setFile(null)
    }

    setLoading(false)
  }

  return (
    <div className="admin">
      <div className="admin-card">
        <h1 className="admin-title">Prashna Admin</h1>
        <p className="admin-sub">Upload a CAT paper PDF to extract and load questions</p>

        <div className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label>Year</label>
              <select value={year} onChange={e => setYear(e.target.value)}>
                {[2024,2023,2022,2021,2020,2019,2018,2017,2016,2015].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Slot</label>
              <select value={slot} onChange={e => setSlot(e.target.value)}>
                <option value="1">Slot 1</option>
                <option value="2">Slot 2</option>
                <option value="3">Slot 3</option>
              </select>
            </div>
          </div>

          <div className="upload-zone" onClick={() => document.getElementById('fileInput').click()}>
            {file ? (
              <div className="file-selected">
                <span className="file-icon">📄</span>
                <span className="file-name">{file.name}</span>
              </div>
            ) : (
              <div className="upload-prompt">
                <span className="upload-icon">⬆</span>
                <span>Click to upload PDF</span>
                <span className="upload-hint">CAT QA paper only</span>
              </div>
            )}
            <input
              id="fileInput"
              type="file"
              accept=".pdf"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
          </div>

          <button
            className="process-btn"
            onClick={processFile}
            disabled={loading || !file}
          >
            {loading ? 'Processing...' : 'Extract Questions'}
          </button>

          {status && (
            <div className={`status-msg ${status.startsWith('✓') ? 'success' : status.startsWith('Error') ? 'error' : 'info'}`}>
              {status}
            </div>
          )}

          {questions.length > 0 && (
            <div className="preview-section">
              <div className="preview-header">
                <span>{questions.length} questions extracted</span>
                <span className="preview-sample">Sample: {questions[0]?.topic} — {questions[0]?.difficulty}</span>
              </div>
              <button
                className="insert-btn"
                onClick={insertToDatabase}
                disabled={loading}
              >
                {loading ? 'Inserting...' : `Add ${questions.length} Questions to Database`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Admin