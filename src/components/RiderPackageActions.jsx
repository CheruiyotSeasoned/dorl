import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Camera, PenLine, CheckCircle2, AlertTriangle, RotateCcw, Upload, X, Send } from 'lucide-react'

// ── Signature Pad ──────────────────────────────────────────────────────────────
function SignaturePad({ onCapture, onClear, hasData }) {
  const canvasRef = useRef(null)
  const drawing   = useRef(false)

  const pos = (e, canvas) => {
    const r = canvas.getBoundingClientRect()
    const src = e.touches ? e.touches[0] : e
    return { x: src.clientX - r.left, y: src.clientY - r.top }
  }

  const start = (e) => {
    e.preventDefault()
    drawing.current = true
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = pos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const move = (e) => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.lineWidth   = 2
    ctx.lineCap     = 'round'
    ctx.strokeStyle = 'var(--text)'
    const { x, y } = pos(e, canvas)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const end = (e) => {
    e.preventDefault()
    drawing.current = false
    onCapture(canvasRef.current.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    onClear()
  }

  return (
    <div>
      <div style={{ position: 'relative', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--surface-muted)', touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          width={440}
          height={140}
          style={{ display: 'block', width: '100%', cursor: 'crosshair' }}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        />
        {!hasData && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: 'var(--text-secondary)', fontSize: 13 }}>
            Sign here
          </div>
        )}
      </div>
      <button type="button" onClick={clear} style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <RotateCcw size={11} /> Clear
      </button>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function RiderPackageActions({ pkg, orderId, onDone }) {
  const qc = useQueryClient()
  const [mode, setMode] = useState(null) // null | 'deliver' | 'return'
  const [photo, setPhoto]             = useState(null)   // File
  const [photoPreview, setPhotoPreview] = useState(null)
  const [signatureData, setSignatureData] = useState('')
  const [hasSig, setHasSig]           = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [returnPhoto, setReturnPhoto] = useState(null)
  const fileRef = useRef(null)
  const returnPhotoRef = useRef(null)

  const canDeliver = pkg.status === 'arrived_at_destination'
  const canReturn  = pkg.status === 'arrived_at_destination' || pkg.status === 'return_requested'
  const isPending  = pkg.status === 'return_requested'

  const uploadMutation = useMutation({
    mutationFn: async ({ type, file, sigData }) => {
      const fd = new FormData()
      fd.append('type', type)
      if (file)    fd.append('photo', file)
      if (sigData) fd.append('signature_data', sigData)
      return api.post(`/packages/${pkg.id}/proof`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status) => api.patch(`/packages/${pkg.id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order-track', String(orderId)] })
      qc.invalidateQueries({ queryKey: ['rider-deliveries'] })
      onDone?.()
    },
  })

  const returnMutation = useMutation({
    mutationFn: async ({ reason, photo: photoFile }) => {
      const fd = new FormData()
      fd.append('package_id', pkg.id)
      fd.append('reason', reason)
      if (photoFile) fd.append('photo', photoFile)
      return api.post('/returns', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order-track', String(orderId)] })
      qc.invalidateQueries({ queryKey: ['rider-deliveries'] })
      toast.success('Return request submitted. Awaiting vendor approval.')
      onDone?.()
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed to submit return request'),
  })

  // Early exit AFTER all hooks — never return before hooks
  if (!canDeliver && !isPending) return null

  const handlePhotoSelect = (e, isReturn = false) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (isReturn) {
      setReturnPhoto(file)
    } else {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleDeliver = async () => {
    const needsPhoto = pkg.requires_photo
    const needsSig   = pkg.requires_signature

    if (needsPhoto && !photo) {
      toast.error('Take a photo of the recipient with the package before marking delivered.')
      return
    }
    if (needsSig && !hasSig) {
      toast.error('Capture the recipient\'s signature before marking delivered.')
      return
    }

    try {
      if (photo) {
        await uploadMutation.mutateAsync({ type: 'photo', file: photo })
      }
      if (hasSig && signatureData) {
        await uploadMutation.mutateAsync({ type: 'signature', sigData: signatureData })
      }
      await statusMutation.mutateAsync('delivered')
      toast.success('Package marked as delivered!')
      setMode(null)
    } catch {
      toast.error('Failed to record delivery. Please try again.')
    }
  }

  const handleReturn = async () => {
    if (!returnReason.trim()) {
      toast.error('Please provide a reason for the return request.')
      return
    }
    await returnMutation.mutateAsync({ reason: returnReason, photo: returnPhoto })
  }

  const busy = uploadMutation.isPending || statusMutation.isPending || returnMutation.isPending

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
      {/* Return-requested badge */}
      {isPending && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--warning-bg, #fef9c3)', borderRadius: 8, marginBottom: 12, fontSize: 13, color: 'var(--warning, #b45309)', fontWeight: 600 }}>
          <AlertTriangle size={14} /> Return request pending vendor approval
        </div>
      )}

      {/* Action buttons */}
      {!mode && canDeliver && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setMode('deliver')} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle2 size={14} /> Mark Delivered
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode('return')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--danger)', borderColor: 'var(--danger)' }}>
            <AlertTriangle size={14} /> Request Return
          </button>
        </div>
      )}

      {/* Deliver flow */}
      {mode === 'deliver' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Confirm Delivery</span>
            <button onClick={() => setMode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={16} /></button>
          </div>

          {/* Photo capture */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Camera size={13} /> Photo {pkg.requires_photo && <span style={{ color: 'var(--danger)' }}>*</span>}
            </div>
            {photoPreview ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={photoPreview} alt="proof" style={{ height: 100, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }} />
                <button onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                  style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--danger)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={11} color="#fff" />
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current.click()} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Camera size={13} /> Take / Upload Photo
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handlePhotoSelect(e)} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Photo of recipient holding package or showing ID</div>
          </div>

          {/* Signature */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <PenLine size={13} /> Signature {pkg.requires_signature && <span style={{ color: 'var(--danger)' }}>*</span>}
            </div>
            <SignaturePad
              onCapture={(data) => { setSignatureData(data); setHasSig(true) }}
              onClear={() => { setSignatureData(''); setHasSig(false) }}
              hasData={hasSig}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleDeliver} disabled={busy}
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {busy ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <CheckCircle2 size={14} />}
              Confirm Delivered
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Return request flow */}
      {mode === 'return' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--danger)' }}>Request Return</span>
            <button onClick={() => setMode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={16} /></button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--surface-muted)', borderRadius: 8, padding: '8px 12px' }}>
            This request will be sent to the vendor and admin for approval. You cannot mark delivery as failed directly.
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: 12 }}>Reason <span style={{ color: 'var(--danger)' }}>*</span></label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Recipient not available, wrong address, refused to accept…"
              value={returnReason}
              onChange={e => setReturnReason(e.target.value)}
              style={{ resize: 'vertical', fontSize: 13 }}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Evidence photo (optional)</div>
            {returnPhoto ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--success)' }}>{returnPhoto.name}</span>
                <button onClick={() => setReturnPhoto(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 0 }}><X size={14} /></button>
              </div>
            ) : (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => returnPhotoRef.current.click()} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Upload size={13} /> Upload Photo
              </button>
            )}
            <input ref={returnPhotoRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handlePhotoSelect(e, true)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-sm" onClick={handleReturn} disabled={busy || !returnReason.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--danger)', color: '#fff', border: 'none' }}>
              {busy ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Send size={13} />}
              Submit Request
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
