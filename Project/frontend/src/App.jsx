import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import ReactStars from 'react-rating-stars-component'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

function buildNumericFilter(operator, value) {
  if (!operator || value === '' || value === null || value === undefined) return null
  const v = String(value).trim()
  if (!v) return null
  return `${operator}${v}`
}

function Drawer({ open, onClose, recipe }) {
  return (
    <div className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`}>
      <div className={`absolute inset-0 bg-black/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-xl transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-5 border-b">
          <div className="text-xl font-semibold">{recipe?.title} <span className="text-gray-400">{recipe?.cuisine ? `• ${recipe.cuisine}` : ''}</span></div>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto h-[calc(100%-64px)]">
          <div>
            <div className="text-sm text-gray-500">Description</div>
            <div className="text-gray-800">{recipe?.description || '—'}</div>
          </div>
          <ExpandableTimes recipe={recipe} />
          <Nutrition recipe={recipe} />
        </div>
      </div>
    </div>
  )
}

function ExpandableTimes({ recipe }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded-md">
      <button className="w-full flex items-center justify-between px-4 py-3" onClick={() => setOpen(o => !o)}>
        <span className="font-medium">Total Time</span>
        <div className="flex items-center gap-3">
          <span className="text-gray-700">{recipe?.total_time ?? '—'}</span>
          <span className="text-gray-400">{open ? '▾' : '▸'}</span>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 text-sm text-gray-700 grid grid-cols-2 gap-3">
          <div>
            <div className="text-gray-500">Prep Time</div>
            <div>{recipe?.prep_time ?? '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">Cook Time</div>
            <div>{recipe?.cook_time ?? '—'}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function Nutrition({ recipe }) {
  const n = recipe?.nutrients || {}
  const rows = [
    ['calories', n.calories],
    ['carbohydrateContent', n.carbohydrateContent],
    ['cholesterolContent', n.cholesterolContent],
    ['fiberContent', n.fiberContent],
    ['proteinContent', n.proteinContent],
    ['saturatedFatContent', n.saturatedFatContent],
    ['sodiumContent', n.sodiumContent],
    ['sugarContent', n.sugarContent],
    ['fatContent', n.fatContent]
  ]
  return (
    <div>
      <div className="font-medium mb-2">Nutrition</div>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2 border">Field</th>
              <th className="text-left p-2 border">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k}>
                <td className="p-2 border text-gray-600">{k}</td>
                <td className="p-2 border">{v || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function App() {
  const [recipes, setRecipes] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [ratingOp, setRatingOp] = useState('>=')
  const [ratingVal, setRatingVal] = useState('')
  const [timeOp, setTimeOp] = useState('<=')
  const [timeVal, setTimeVal] = useState('')
  const [calOp, setCalOp] = useState('<=')
  const [calVal, setCalVal] = useState('')

  const hasFilters = useMemo(() => {
    return (
      title.trim() || cuisine.trim() || ratingVal !== '' || timeVal !== '' || calVal !== ''
    )
  }, [title, cuisine, ratingVal, timeVal, calVal])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError('')
      try {
        if (hasFilters) {
          const params = new URLSearchParams()
          if (title.trim()) params.set('title', title.trim())
          if (cuisine.trim()) params.set('cuisine', cuisine.trim())
          const rf = buildNumericFilter(ratingOp, ratingVal)
          const tf = buildNumericFilter(timeOp, timeVal)
          const cf = buildNumericFilter(calOp, calVal)
          if (rf) params.set('rating', rf)
          if (tf) params.set('total_time', tf)
          if (cf) params.set('calories', cf)
          const res = await axios.get(`${API_BASE}/api/recipes/search?${params.toString()}`)
          setRecipes(res.data.data || [])
          setTotal((res.data.data || []).length)
        } else {
          const res = await axios.get(`${API_BASE}/api/recipes`, { params: { page, limit } })
          setRecipes(res.data.data || [])
          setTotal(res.data.total || 0)
        }
      } catch (e) {
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [page, limit, title, cuisine, ratingOp, ratingVal, timeOp, timeVal, calOp, calVal, hasFilters])

  function clearFilters() {
    setTitle('')
    setCuisine('')
    setRatingOp('>=')
    setRatingVal('')
    setTimeOp('<=')
    setTimeVal('')
    setCalOp('<=')
    setCalVal('')
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Recipes</h1>
        <p className="text-gray-600">Browse, filter and inspect recipe details.</p>
      </div>

      <div className="bg-white border rounded-md p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Title contains</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g., pie" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Cuisine equals</label>
            <input value={cuisine} onChange={e => setCuisine(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g., Italian" />
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Rating</label>
              <div className="flex gap-2">
                <select value={ratingOp} onChange={e => setRatingOp(e.target.value)} className="border rounded px-2">
                  <option>{'>='}</option>
                  <option>{'<='}</option>
                  <option>{'='}</option>
                  <option>{'>'}</option>
                  <option>{'<'}</option>
                </select>
                <input value={ratingVal} onChange={e => setRatingVal(e.target.value)} className="flex-1 border rounded px-3 py-2" placeholder="e.g., 4.5" />
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Total Time (mins)</label>
              <div className="flex gap-2">
                <select value={timeOp} onChange={e => setTimeOp(e.target.value)} className="border rounded px-2">
                  <option>{'<='}</option>
                  <option>{'>='}</option>
                  <option>{'='}</option>
                  <option>{'>'}</option>
                  <option>{'<'}</option>
                </select>
                <input value={timeVal} onChange={e => setTimeVal(e.target.value)} className="flex-1 border rounded px-3 py-2" placeholder="e.g., 120" />
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Calories</label>
              <div className="flex gap-2">
                <select value={calOp} onChange={e => setCalOp(e.target.value)} className="border rounded px-2">
                  <option>{'<='}</option>
                  <option>{'>='}</option>
                  <option>{'='}</option>
                  <option>{'>'}</option>
                  <option>{'<'}</option>
                </select>
                <input value={calVal} onChange={e => setCalVal(e.target.value)} className="flex-1 border rounded px-3 py-2" placeholder="e.g., 400" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => { setPage(1) }} className="px-3 py-2 bg-blue-600 text-white rounded">Apply</button>
          <button onClick={clearFilters} className="px-3 py-2 border rounded">Clear</button>
        </div>
      </div>

      <div className="bg-white border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Cuisine</th>
                <th className="text-left p-3">Rating</th>
                <th className="text-left p-3">Total Time</th>
                <th className="text-left p-3">Serves</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map(r => (
                <tr key={r._id || r.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(r)}>
                  <td className="p-3 max-w-[260px]"><span className="block truncate" title={r.title}>{r.title}</span></td>
                  <td className="p-3">{r.cuisine || '—'}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <ReactStars count={5} value={Number(r.rating) || 0} size={18} isHalf={true} edit={false} activeColor="#ffd700" />
                      <span className="text-sm text-gray-500">{r.rating ?? '—'}</span>
                    </div>
                  </td>
                  <td className="p-3">{r.total_time ?? '—'}</td>
                  <td className="p-3">{r.serves || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <div className="p-4 text-center text-gray-500">Loading…</div>}
        {!loading && recipes.length === 0 && <div className="p-6 text-center text-gray-600">{hasFilters ? 'No results found' : 'No data available'}</div>}
        {!hasFilters && (
          <div className="flex items-center justify-between p-3 border-t">
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
              <span className="text-sm text-gray-600">Page {page}</span>
              <button disabled={(page * limit) >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Per page</span>
              <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1) }} className="border rounded px-2 py-1">
                {[15, 20, 30, 40, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-sm text-gray-600">of {total}</span>
            </div>
          </div>
        )}
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} recipe={selected} />

      {error && <div className="mt-3 text-red-600">{error}</div>}
    </div>
  )
}


