'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function UploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<'upload' | 'camera'>('upload');
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setPreview(URL.createObjectURL(file));
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files?.[0]; if (f) handleFile(f);
  };

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(s); setMode('camera');
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
      }, 100);
    } catch { alert('Camera access denied.'); }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const cv = document.createElement('canvas');
    cv.width = videoRef.current.videoWidth; cv.height = videoRef.current.videoHeight;
    const cx = cv.getContext('2d'); if (!cx) return;
    cx.scale(-1, 1); cx.drawImage(videoRef.current, -cv.width, 0);
    setPreview(cv.toDataURL('image/jpeg')); stopCamera();
  };

  const stopCamera = () => { stream?.getTracks().forEach(t => t.stop()); setStream(null); setMode('upload'); };

  const runScan = () => {
    if (!preview) return;
    setScanning(true);
    setTimeout(() => { setScanning(false); setScanDone(true); }, 2600);
  };

  const handleNext = () => {
    if (preview) { sessionStorage.setItem('medusa_selfie', preview); router.push('/look'); }
  };

  useEffect(() => {
    if (scanDone) { const t = setTimeout(handleNext, 700); return () => clearTimeout(t); }
  }, [scanDone]);

  useEffect(() => () => { stream?.getTracks().forEach(t => t.stop()); }, [stream]);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />

      <main style={{ paddingTop: 'calc(var(--nav-h) + 60px)', paddingBottom: 80 }}>
        <div className="wrap" style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Header */}
          <div className="anim-fade-up" style={{ marginBottom: 48, textAlign: 'center' }}>
            <span className="tag" style={{ marginBottom: 20, display: 'inline-flex' }}>Step 01 of 03</span>
            <h1 className="serif" style={{ fontSize: 'clamp(40px, 7vw, 68px)', lineHeight: 0.95, letterSpacing: '-0.025em', marginBottom: 16 }}>
              Show us<br />
              <em className="serif-italic" style={{ color: 'var(--accent)' }}>your face.</em>
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.75, fontWeight: 300, maxWidth: 340, margin: '0 auto' }}>
              Any lighting, any angle. We analyse skin tone, undertone and facial structure.
            </p>
          </div>

          {/* Upload zone */}
          {!preview && mode === 'upload' && (
            <div className="anim-fade-up-d1">
              <div
                className={`upload-zone ${isDragging ? 'drag' : ''}`}
                style={{ padding: '60px 24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginBottom: 16 }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
              >
                <div
                  className="anim-float"
                  style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--accent-tint)', border: '1px solid rgba(181,96,74,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="15" r="8" stroke="rgba(181,96,74,.7)" strokeWidth="1.5" />
                    <path d="M6 32c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="rgba(181,96,74,.4)" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="15" cy="14" r="1.5" fill="rgba(181,96,74,.6)" />
                    <circle cx="21" cy="14" r="1.5" fill="rgba(181,96,74,.6)" />
                  </svg>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 15, color: 'var(--text)', fontWeight: 500, marginBottom: 4 }}>Drop your photo here</p>
                  <p style={{ fontSize: 13, color: 'var(--text-2)' }}>or click to browse · JPG, PNG, WEBP</p>
                </div>
              </div>

              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onInputChange} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '16px 0' }}>
                <div className="line-gradient" style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.1em' }}>OR</span>
                <div className="line-gradient" style={{ flex: 1 }} />
              </div>

              <button onClick={startCamera} className="btn btn-ghost" style={{ width: '100%', gap: 10 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Take a selfie with camera
              </button>

              {/* Tips */}
              <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['Face front-facing, good light', 'Remove glasses if possible', 'No filters — we need your real skin'].map((tip, i) => (
                  <p key={i} style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--accent)' }}>✦</span> {tip}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Camera view */}
          {mode === 'camera' && !preview && (
            <div className="anim-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: 380, aspectRatio: '3/4', borderRadius: 20, overflow: 'hidden', border: '1.5px solid var(--line)' }}>
                <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} playsInline muted />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ width: '55%', height: '70%', border: '1.5px solid rgba(181,96,74,.5)', borderRadius: '50%' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={capturePhoto} className="btn btn-dark">Capture →</button>
                <button onClick={stopCamera} className="btn btn-ghost">Cancel</button>
              </div>
            </div>
          )}

          {/* Preview + scan */}
          {preview && (
            <div className="anim-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: 360, aspectRatio: '3/4', borderRadius: 20, overflow: 'hidden', border: '1.5px solid var(--line)', boxShadow: '0 24px 60px rgba(28,20,16,.12)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Your selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                {scanning && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,246,241,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                    <div style={{ position: 'absolute', left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', animation: 'scanLine 1.3s ease-in-out infinite', top: 0 }} />
                    {['top-4 left-4','top-4 right-4','bottom-4 left-4','bottom-4 right-4'].map((_, j) => (
                      <div key={j} style={{ position: 'absolute', width: 18, height: 18, ...(j===0?{top:16,left:16,borderTop:'1.5px solid var(--accent)',borderLeft:'1.5px solid var(--accent)'}:j===1?{top:16,right:16,borderTop:'1.5px solid var(--accent)',borderRight:'1.5px solid var(--accent)'}:j===2?{bottom:16,left:16,borderBottom:'1.5px solid var(--accent)',borderLeft:'1.5px solid var(--accent)'}:{bottom:16,right:16,borderBottom:'1.5px solid var(--accent)',borderRight:'1.5px solid var(--accent)'}) }} />
                    ))}
                    <div style={{ display: 'flex', gap: 8, marginTop: 80 }}>
                      {[0,1,2].map(j => <span key={j} className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animationDelay: `${j*.2}s` }} />)}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Analysing face</p>
                  </div>
                )}

                {scanDone && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,246,241,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(181,96,74,.3)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>Face mapped ✦</p>
                  </div>
                )}
              </div>

              {scanDone && (
                <div className="anim-fade-in" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['Warm Undertone','Oval Face','Medium Depth'].map(t => (
                    <span key={t} className="tag tag-accent">{t}</span>
                  ))}
                </div>
              )}

              {!scanning && !scanDone && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button onClick={runScan} className="btn btn-accent">Analyse my face →</button>
                  <button onClick={() => setPreview(null)} className="btn btn-ghost">Retake</button>
                </div>
              )}
              {scanning && <p style={{ fontSize: 14, color: 'var(--text-2)' }}>Reading your features…</p>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
