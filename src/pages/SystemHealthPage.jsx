import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import {
  Activity, Server, Database, Cpu, HardDrive, MemoryStick,
  RefreshCw, CheckCircle2, XCircle, AlertTriangle, Clock,
  Layers, Inbox,
} from 'lucide-react'

const SERVICE_LABELS = {
  nginx:        'Nginx',
  'php8.3-fpm': 'PHP 8.3-FPM',
  mysql:        'MySQL',
  supervisor:   'Supervisor',
}

const SERVICE_ICONS = {
  nginx:        Server,
  'php8.3-fpm': Layers,
  mysql:        Database,
  supervisor:   Activity,
}

function StatusDot({ ok }) {
  return (
    <span style={{
      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
      background: ok ? '#22c55e' : '#ef4444',
      boxShadow: ok ? '0 0 6px rgba(34,197,94,0.6)' : '0 0 6px rgba(239,68,68,0.6)',
    }} />
  )
}

function ServiceCard({ name, status }) {
  const running = status === 'running'
  const Icon = SERVICE_ICONS[name] ?? Server
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${running ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.25)'}`,
      borderRadius: 12,
      padding: '16px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: running ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color={running ? '#22c55e' : '#ef4444'} strokeWidth={1.75} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
          {SERVICE_LABELS[name] ?? name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <StatusDot ok={running} />
          <span style={{ fontSize: 11, color: running ? '#22c55e' : '#ef4444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {running ? 'Running' : 'Stopped'}
          </span>
        </div>
      </div>
    </div>
  )
}

function ResourceBar({ label, icon: Icon, value, max, unit, percent, color = '#6366f1' }) {
  const pct = percent ?? (max > 0 ? Math.round(value / max * 100) : 0)
  const warn = pct > 85
  const barColor = warn ? '#f59e0b' : color
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Icon size={16} color='var(--text-secondary)' strokeWidth={1.75} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
        {warn && <AlertTriangle size={13} color='#f59e0b' style={{ marginLeft: 'auto' }} />}
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginLeft: warn ? 0 : 'auto' }}>
          {pct}%
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'var(--surface-muted)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          width: `${pct}%`,
          background: barColor,
          transition: 'width 0.4s ease',
        }} />
      </div>
      {unit && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>{unit}</div>
      )}
    </div>
  )
}

function WorkerRow({ worker }) {
  const running = worker.status === 'RUNNING'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      borderRadius: 8,
      background: 'var(--surface-muted)',
      marginBottom: 6,
    }}>
      <StatusDot ok={running} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {worker.name}
        </div>
        {worker.uptime && (
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>uptime {worker.uptime} · pid {worker.pid}</div>
        )}
      </div>
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
        background: running ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
        color: running ? '#22c55e' : '#ef4444',
        textTransform: 'uppercase', letterSpacing: '0.4px',
      }}>
        {worker.status}
      </span>
    </div>
  )
}

function QueueStat({ label, value, warn }) {
  return (
    <div style={{
      flex: 1, textAlign: 'center', padding: '16px 12px',
      background: warn && value > 0 ? 'rgba(239,68,68,0.05)' : 'var(--surface-muted)',
      borderRadius: 10,
      border: warn && value > 0 ? '1px solid rgba(239,68,68,0.2)' : '1px solid transparent',
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: warn && value > 0 ? '#ef4444' : 'var(--text-primary)', lineHeight: 1 }}>
        {value < 0 ? '—' : value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  )
}

export default function SystemHealthPage() {
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => api.get('/admin/system/health').then(r => r.data),
    refetchInterval: 30_000,
    staleTime: 20_000,
  })

  const checkedAt = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null
  const allServicesOk = data && Object.values(data.services).every(s => s === 'running')
  const allWorkersOk  = data && data.workers.every(w => w.status === 'RUNNING')

  return (
    <div style={{ maxWidth: 900 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            System Health
          </h1>
          {checkedAt && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} /> Last checked {checkedAt} · auto-refreshes every 30s
            </div>
          )}
        </div>

        {data && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 99,
            background: allServicesOk && allWorkersOk ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${allServicesOk && allWorkersOk ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}>
            {allServicesOk && allWorkersOk
              ? <CheckCircle2 size={14} color='#22c55e' />
              : <XCircle size={14} color='#ef4444' />}
            <span style={{ fontSize: 12, fontWeight: 700, color: allServicesOk && allWorkersOk ? '#22c55e' : '#ef4444' }}>
              {allServicesOk && allWorkersOk ? 'All Systems Operational' : 'Degraded'}
            </span>
          </div>
        )}

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
            background: 'var(--surface)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
            opacity: isFetching ? 0.6 : 1,
          }}
        >
          <RefreshCw size={13} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          Loading system status…
        </div>
      )}

      {isError && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#ef4444' }}>
          Failed to load system health. Check your connection.
        </div>
      )}

      {data && (
        <>
          {/* Services */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
              Services
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: 10 }}>
              {Object.entries(data.services).map(([name, status]) => (
                <ServiceCard key={name} name={name} status={status} />
              ))}
            </div>
          </div>

          {/* Resources */}
          <div style={{ marginBottom: 10, marginTop: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
              Resources
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
              <ResourceBar
                label="CPU"
                icon={Cpu}
                percent={data.resources.cpu_percent}
                color='#6366f1'
              />
              <ResourceBar
                label="Memory"
                icon={MemoryStick}
                percent={data.resources.ram_percent}
                unit={`${data.resources.ram_used_mb} MB / ${data.resources.ram_total_mb} MB`}
                color='#0ea5e9'
              />
              <ResourceBar
                label="Disk"
                icon={HardDrive}
                percent={data.resources.disk_percent}
                unit={`${(data.resources.disk_used / 1024 / 1024).toFixed(1)} GB used of ${(data.resources.disk_total / 1024 / 1024).toFixed(0)} GB`}
                color='#8b5cf6'
              />
            </div>
          </div>

          {/* Workers + Queue */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 22 }}>

            {/* Workers */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>
                Supervisor Workers
              </div>
              {data.workers.length === 0
                ? <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No workers found</div>
                : data.workers.map(w => <WorkerRow key={w.name} worker={w} />)
              }
            </div>

            {/* Queue */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <Inbox size={13} color='var(--text-secondary)' />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                  Job Queue
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <QueueStat label="Pending" value={data.queue.pending} />
                <QueueStat label="Failed" value={data.queue.failed} warn />
              </div>
              {data.queue.failed > 0 && (
                <div style={{ marginTop: 12, fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={12} />
                  Run <code style={{ background: 'var(--surface-muted)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>php artisan queue:retry all</code> on the server
                </div>
              )}
            </div>
          </div>

          {/* Recent Errors */}
          <div style={{ marginTop: 22, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>
              Recent Laravel Errors
            </div>
            {data.recent_errors.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#22c55e', fontSize: 13 }}>
                <CheckCircle2 size={14} /> No errors in log
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.recent_errors.map((line, i) => (
                  <div key={i} style={{
                    fontSize: 11, fontFamily: 'monospace',
                    background: 'rgba(239,68,68,0.05)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    borderRadius: 6, padding: '6px 10px',
                    color: 'var(--text-primary)',
                    overflowX: 'auto', whiteSpace: 'pre',
                  }}>
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
