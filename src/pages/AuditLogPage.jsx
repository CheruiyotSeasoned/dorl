import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import Select from '../components/Select'

function JsonDiff({ before, after }) {
  if (!before && !after) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
      {[['Before', before], ['After', after]].map(([label, val]) => val && (
        <div key={label}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>
          <pre style={{ margin: 0, fontSize: 11, background: 'var(--surface-muted)', borderRadius: 6, padding: 10, overflow: 'auto', maxHeight: 200, color: 'var(--text-primary)' }}>
            {JSON.stringify(val, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  )
}

function LogRow({ log }) {
  const [expanded, setExpanded] = useState(false)
  const hasDiff = log.before || log.after
  return (
    <>
      <tr
        onClick={() => hasDiff && setExpanded(e => !e)}
        style={{ cursor: hasDiff ? 'pointer' : 'default' }}
      >
        <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          {new Date(log.created_at).toLocaleString()}
        </td>
        <td>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{log.actor_email ?? 'System'}</div>
        </td>
        <td>
          <code style={{ fontSize: 12, background: 'var(--surface-muted)', padding: '2px 6px', borderRadius: 4 }}>
            {log.action}
          </code>
        </td>
        <td style={{ fontSize: 13 }}>
          {log.target_type && <span style={{ color: 'var(--text-secondary)' }}>{log.target_type} </span>}
          {log.target_id && <span style={{ fontSize: 12, fontFamily: 'monospace' }}>#{log.target_id}</span>}
        </td>
        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{log.ip_address}</td>
        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{log.reason ?? '—'}</td>
        <td>
          {hasDiff && (expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
        </td>
      </tr>
      {expanded && hasDiff && (
        <tr>
          <td colSpan={7} style={{ background: 'var(--surface-muted)', padding: 16 }}>
            <JsonDiff before={log.before} after={log.after} />
          </td>
        </tr>
      )}
    </>
  )
}

export default function AuditLogPage() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['audit-log'],
    queryFn: () => api.get('/admin/audit-logs').then(r => r.data.data),
  })

  const logs = (data?.data ?? data ?? []).filter(log => {
    const matchAction = !actionFilter || log.action?.includes(actionFilter)
    const matchSearch = !search || log.actor_email?.toLowerCase().includes(search.toLowerCase()) || log.action?.toLowerCase().includes(search.toLowerCase()) || log.target_type?.toLowerCase().includes(search.toLowerCase())
    return matchAction && matchSearch
  })

  const uniqueActions = [...new Set((data?.data ?? data ?? []).map(l => l.action))].sort()

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Audit Log</h1>
        <span className="text-muted text-sm">{logs.length} entries</span>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input className="form-control" style={{ paddingLeft: 32 }} placeholder="Search actor, action…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select
          style={{ width: 220 }}
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          options={[{ value: '', label: 'All Actions' }, ...uniqueActions.map(a => ({ value: a, label: a }))]}
        />
      </div>

      <div className="card">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><span className="spinner" /></div>
        ) : logs.length === 0 ? (
          <p className="text-muted text-sm">No audit log entries found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>IP</th>
                  <th>Reason</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => <LogRow key={log.id} log={log} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
