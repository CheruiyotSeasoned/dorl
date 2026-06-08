import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Upload, FileSpreadsheet, AlertCircle, ArrowLeft, CheckCircle,
  Link, ClipboardList, FileText, FileType, Download, Wand2,
} from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

const TEMPLATE_HEADERS = [
  'customer_name', 'customer_phone', 'pickup_station',
  'item_description', 'quantity', 'unit_price', 'our_fee', 'weight_kg', 'notes',
]
const TEMPLATE_EXAMPLE = [
  'John Doe', '0712345678', 'Westlands Pickup', 'iPhone 15 Case', '1', '2500', '500', '0.2', 'Handle with care',
]

const IMPORT_MODES = [
  { id: 'file',         label: 'Upload File',      icon: Upload,        desc: 'Excel, CSV or Word doc' },
  { id: 'sheets',       label: 'Google Sheets',    icon: Link,          desc: 'Paste a shared sheet URL' },
  { id: 'paste',        label: 'Paste CSV / TSV',  icon: ClipboardList, desc: 'Copy-paste directly' },
  { id: 'template',     label: 'Get Template',     icon: Download,      desc: 'Download & fill in' },
]

function ImportResult({ result }) {
  if (!result) return null
  return (
    <div style={{ marginTop: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div style={{ padding: '10px 14px', background: result.imported > 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <CheckCircle size={15} style={{ color: '#16a34a' }} />
        <span style={{ fontWeight: 600, fontSize: 14, color: '#16a34a' }}>
          {result.imported} {result.imported === 1 ? 'item' : 'items'} imported successfully
        </span>
      </div>
      {result.errors?.length > 0 && (
        <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.04)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 6 }}>
            {result.errors.length} warning{result.errors.length > 1 ? 's' : ''}:
          </div>
          {result.errors.map((err, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, color: '#dc2626', fontSize: 12, marginBottom: 3 }}>
              <AlertCircle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
              {err}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CreateShipmentPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuthStore()
  const fileRef = useRef()

  const [form, setForm] = useState({ title: '', origin_country: '', carrier: '', carrier_tracking: '', vendor_id: '', notes: '' })
  const [shipmentId, setShipmentId] = useState(null)
  const [masterCode, setMasterCode] = useState(null)

  // Import state
  const [importMode, setImportMode] = useState('file')
  const [file, setFile] = useState(null)
  const [sheetsUrl, setSheetsUrl] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false)

  const { data: vendors } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: () => api.get('/vendors').then(r => r.data.data),
    enabled: isAdmin(),
  })

  const createShipment = useMutation({
    mutationFn: (data) => api.post('/shipments', data).then(r => r.data.data),
    onSuccess: (shipment) => {
      setShipmentId(shipment.id)
      setMasterCode(shipment.master_code)
      toast.success(`Shipment ${shipment.master_code} created`)
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to create shipment'),
  })

  // Shared success handler
  const onImportSuccess = (res) => {
    setImportResult(res)
    if (res.errors?.length === 0) {
      toast.success(`${res.imported} items imported!`)
      setTimeout(() => navigate(`/shipments/${shipmentId}`), 1200)
    } else {
      toast.success(`${res.imported} items imported with ${res.errors.length} warning(s)`)
    }
  }
  const onImportError = (e) => toast.error(e.response?.data?.error || 'Import failed')

  const importFile = useMutation({
    mutationFn: ({ id, file }) => {
      const fd = new FormData()
      fd.append('file', file)
      return api.post(`/shipments/${id}/import-items`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
    },
    onSuccess: onImportSuccess,
    onError: onImportError,
  })

  const importSheets = useMutation({
    mutationFn: ({ id, url }) =>
      api.post(`/shipments/${id}/import-google-sheets`, { url }).then(r => r.data),
    onSuccess: onImportSuccess,
    onError: onImportError,
  })

  const importText = useMutation({
    mutationFn: ({ id, text }) =>
      api.post(`/shipments/${id}/import-text`, { text }).then(r => r.data),
    onSuccess: onImportSuccess,
    onError: onImportError,
  })

  const isImporting = importFile.isPending || importSheets.isPending || importText.isPending

  const handleCreate = (e) => {
    e.preventDefault()
    createShipment.mutate(form)
  }

  const handleImport = () => {
    if (!shipmentId) return
    setImportResult(null)
    if (importMode === 'file') {
      if (!file) { toast.error('Please select a file'); return }
      importFile.mutate({ id: shipmentId, file })
    } else if (importMode === 'sheets') {
      if (!sheetsUrl.trim()) { toast.error('Please paste your Google Sheets URL'); return }
      importSheets.mutate({ id: shipmentId, url: sheetsUrl.trim() })
    } else if (importMode === 'paste') {
      if (!pasteText.trim()) { toast.error('Please paste your data'); return }
      importText.mutate({ id: shipmentId, text: pasteText.trim() })
    }
  }

  const downloadCsvTemplate = () => {
    const csv = TEMPLATE_HEADERS.join(',') + '\n' + TEMPLATE_EXAMPLE.join(',')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'shipment_items_template.csv'
    a.click(); URL.revokeObjectURL(url)
  }

  const downloadWordTemplate = () => {
    window.open(`${import.meta.env.VITE_API_URL || ''}/api/shipments/template/word`, '_blank')
  }

  const canImport = importMode === 'file' ? !!file
    : importMode === 'sheets' ? !!sheetsUrl.trim()
    : importMode === 'paste'  ? !!pasteText.trim()
    : false

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/shipments')}>
          <ArrowLeft size={15} /> Back
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>New Consolidated Shipment</h1>
      </div>

      {/* ── Step 1 ── */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 24, height: 24, borderRadius: '50%', background: shipmentId ? '#22c55e' : 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {shipmentId ? '✓' : '1'}
          </span>
          Shipment Details
        </h2>

        {shipmentId ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#16a34a', fontWeight: 600 }}>
            <CheckCircle size={18} />
            Shipment <span style={{ fontFamily: 'monospace' }}>{masterCode}</span> created — proceed to Step 2
          </div>
        ) : (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isAdmin() && (
              <div className="form-group">
                <label>Seller / Vendor *</label>
                <select className="form-control" value={form.vendor_id}
                  onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))} required>
                  <option value="">Select seller…</option>
                  {(vendors || []).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Shipment Title *</label>
              <input className="form-control" placeholder="e.g. Amazon US Batch — May 2026"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Origin Country</label>
                <input className="form-control" placeholder="e.g. United States"
                  value={form.origin_country} onChange={e => setForm(f => ({ ...f, origin_country: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Carrier</label>
                <input className="form-control" placeholder="e.g. DHL, FedEx"
                  value={form.carrier} onChange={e => setForm(f => ({ ...f, carrier: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Carrier Tracking Number
                <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Wand2 size={10} /> Auto-generated if left blank
                </span>
              </label>
              <input
                className="form-control"
                placeholder="Leave blank to auto-generate (STK-XXXX-YYMMDD)"
                value={form.carrier_tracking}
                onChange={e => setForm(f => ({ ...f, carrier_tracking: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea className="form-control" rows={2}
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={createShipment.isPending} style={{ alignSelf: 'flex-start' }}>
              {createShipment.isPending ? 'Creating…' : 'Create Shipment'}
            </button>
          </form>
        )}
      </div>

      {/* ── Step 2 ── */}
      <div className="card" style={{ padding: 24, opacity: shipmentId ? 1 : 0.45, pointerEvents: shipmentId ? 'auto' : 'none' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
          Import Customer Items
        </h2>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {IMPORT_MODES.map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setImportMode(id); setImportResult(null) }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 14px',
                borderRadius: 10, border: `2px solid ${importMode === id ? 'var(--primary)' : 'var(--border)'}`,
                background: importMode === id ? 'rgba(var(--primary-rgb),0.06)' : 'var(--surface)',
                cursor: 'pointer', minWidth: 130, flex: 1, transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Icon size={14} style={{ color: importMode === id ? 'var(--primary)' : 'var(--text-secondary)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: importMode === id ? 'var(--primary)' : 'var(--text-primary)' }}>{label}</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{desc}</span>
            </button>
          ))}
        </div>

        {/* ── File upload ── */}
        {importMode === 'file' && (
          <div>
            <div
              style={{
                border: `2px dashed ${file ? '#22c55e' : 'var(--border)'}`,
                borderRadius: 10, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
                background: file ? 'rgba(34,197,94,0.04)' : 'transparent', marginBottom: 12,
                transition: 'all 0.15s',
              }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary)' }}
              onDragLeave={e => { e.currentTarget.style.borderColor = file ? '#22c55e' : 'var(--border)' }}
              onDrop={e => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f) setFile(f)
                e.currentTarget.style.borderColor = '#22c55e'
              }}
            >
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.docx,.doc" style={{ display: 'none' }}
                onChange={e => { setFile(e.target.files[0] || null); e.target.value = '' }} />
              {file ? (
                <div>
                  <CheckCircle size={28} style={{ color: '#22c55e', marginBottom: 8 }} />
                  <div style={{ fontWeight: 700, color: '#16a34a', fontSize: 15 }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {(file.size / 1024).toFixed(1)} KB · Click to change
                  </div>
                </div>
              ) : (
                <div>
                  <Upload size={28} style={{ color: 'var(--text-secondary)', marginBottom: 8 }} />
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Drop file here or click to browse</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FileSpreadsheet size={12} /> Excel (.xlsx, .xls)</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={12} /> CSV (.csv)</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FileType size={12} /> Word (.docx)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Google Sheets ── */}
        {importMode === 'sheets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.07)', fontSize: 13 }}>
              <strong style={{ color: '#3b82f6' }}>How to share your Google Sheet:</strong>
              <ol style={{ margin: '8px 0 0', paddingLeft: 18, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                <li>Open your Google Sheet and click <strong>Share</strong> (top right)</li>
                <li>Under "General access", change to <strong>"Anyone with the link"</strong> → Viewer</li>
                <li>Copy the URL from your browser and paste it below</li>
              </ol>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Google Sheets URL *</label>
              <input
                className="form-control"
                placeholder="https://docs.google.com/spreadsheets/d/…"
                value={sheetsUrl}
                onChange={e => setSheetsUrl(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: 13 }}
              />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              The first row must be column headers matching the template (customer_name, customer_phone, etc.)
            </div>
          </div>
        )}

        {/* ── Paste CSV / TSV ── */}
        {importMode === 'paste' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.07)', fontSize: 13, color: 'var(--text-secondary)' }}>
              Paste comma-separated (CSV) or tab-separated (TSV) data directly. The first row must be the column headers.
              You can copy a range directly from Google Sheets or Excel.
            </div>
            <textarea
              className="form-control"
              rows={10}
              placeholder={`customer_name,customer_phone,pickup_station,item_description,quantity,unit_price,our_fee,weight_kg,notes\nJohn Doe,0712345678,Westlands Pickup,iPhone Case,1,2500,500,0.2,`}
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, resize: 'vertical' }}
            />
            {pasteText && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {pasteText.trim().split('\n').length - 1} data row(s) detected
              </div>
            )}
          </div>
        )}

        {/* ── Template download ── */}
        {importMode === 'template' && (
          <div>
            <div style={{ padding: '16px 18px', borderRadius: 10, background: 'rgba(59,130,246,0.06)', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Required column headers:</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TEMPLATE_HEADERS.map(h => (
                  <code key={h} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>{h}</code>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Example row:</div>
              <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      {TEMPLATE_HEADERS.map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {TEMPLATE_EXAMPLE.map((v, i) => (
                        <td key={i} style={{ padding: '8px 10px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{v}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={downloadCsvTemplate}>
                <FileText size={14} /> Download CSV Template
              </button>
              <button className="btn btn-secondary" onClick={downloadWordTemplate}>
                <FileType size={14} /> Download Word Template (.docx)
              </button>
            </div>

            <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.07)', fontSize: 13, color: 'var(--text-secondary)' }}>
              After filling in the template, come back and use the <strong>Upload File</strong> or <strong>Paste CSV</strong> tab to import your data.
            </div>
          </div>
        )}

        {/* Column reference (compact, shown for upload/sheets/paste modes) */}
        {importMode !== 'template' && (
          <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 12 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)', marginRight: 6 }}>Columns:</span>
            {TEMPLATE_HEADERS.map((h, i) => (
              <span key={h}>
                <code style={{ color: 'var(--primary)', background: 'rgba(var(--primary-rgb),0.07)', padding: '1px 5px', borderRadius: 4 }}>{h}</code>
                {i < TEMPLATE_HEADERS.length - 1 && <span style={{ color: 'var(--border)', margin: '0 3px' }}>·</span>}
              </span>
            ))}
          </div>
        )}

        {/* Action button */}
        {importMode !== 'template' && (
          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={!canImport || isImporting}
            style={{ marginTop: 16, minWidth: 160 }}
          >
            {isImporting ? 'Importing…' : 'Import Items'}
          </button>
        )}

        <ImportResult result={importResult} />
      </div>
    </div>
  )
}
