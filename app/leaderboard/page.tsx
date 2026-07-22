'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Leaderboard() {
  const router = useRouter()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => { setRows(d.leaderboard || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const medal = (rank: number) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--t1)', fontFamily: 'Inter, sans-serif', paddingBottom: 100 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--pri)', marginBottom: 4 }}>🏆 Leaderboard</h1>
        <p style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 20 }}>Earn points: 1 per check-in, 5 per location added.</p>

        {loading ? (
          <p style={{ color: 'var(--t3)', fontSize: 14 }}>Loading…</p>
        ) : rows.length === 0 ? (
          <p style={{ color: 'var(--t3)', fontSize: 14 }}>No ranked users yet — be the first to check in!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map(r => (
              <div key={r.user_id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14,
                background: r.rank <= 3 ? 'rgba(0,219,231,0.06)' : 'var(--s1, #1a1e1f)',
                border: '1px solid ' + (r.rank <= 3 ? 'rgba(0,219,231,0.2)' : 'var(--b1, rgba(255,255,255,0.06))'),
              }}>
                <div style={{ width: 32, textAlign: 'center', fontSize: r.rank <= 3 ? 20 : 14, fontWeight: 800, color: 'var(--t2)' }}>
                  {medal(r.rank) || r.rank}
                </div>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--s-base, #222)', fontSize: 20 }}>
                  {r.avatar_url ? <img src={r.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : r.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{r.checkins} check-in{r.checkins !== 1 ? 's' : ''} · {r.adds} added</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--cyan, #00b4cc)' }}>{r.points}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)' }}>points</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => router.push('/search')} style={{ marginTop: 24, padding: '10px 18px', borderRadius: 10, background: 'var(--grad, linear-gradient(90deg,#00e5ff,#9c27ff))', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          ← Back to map
        </button>
      </div>
    </div>
  )
}
