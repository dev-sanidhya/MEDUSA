'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

async function compressToBase64(source: File | string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 900;
      let { width: w, height: h } = img;
      if (w > MAX || h > MAX) { const r = Math.min(MAX/w, MAX/h); w = Math.round(w*r); h = Math.round(h*r); }
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d'); if (!ctx) { reject(new Error('ctx')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(cv.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    if (typeof source === 'string') { img.src = source; }
    else { const r = new FileReader(); r.onload = e => { img.src = e.target?.result as string; }; r.onerror = reject; r.readAsDataURL(source); }
  });
}

export default function UploadPage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const vidRef  = useRef<HTMLVideoElement>(null);
  const [preview,    setPreview]    = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mode,       setMode]       = useState<'upload' | 'camera'>('upload');
  const [scanning,   setScanning]   = useState(false);
  const [scanDone,   setScanDone]   = useState(false);
  const [stream,     setStream]     = useState<MediaStream | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try { setPreview(await compressToBase64(file)); }
    catch { alert('Could not read image. Please try another.'); }
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); };

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 900 } } });
      setStream(s); setMode('camera');
      setTimeout(() => { if (vidRef.current) { vidRef.current.srcObject = s; vidRef.current.play(); } }, 100);
    } catch { alert('Camera access denied.'); }
  };

  const capturePhoto = () => {
    if (!vidRef.current) return;
    const MAX = 900; let w = vidRef.current.videoWidth, h = vidRef.current.videoHeight;
    if (w > MAX || h > MAX) { const r = Math.min(MAX/w, MAX/h); w = Math.round(w*r); h = Math.round(h*r); }
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    ctx.scale(-1,1); ctx.drawImage(vidRef.current, -w, 0, w, h);
    setPreview(cv.toDataURL('image/jpeg', 0.82)); stopCamera();
  };

  const stopCamera = () => { stream?.getTracks().forEach(t => t.stop()); setStream(null); setMode('upload'); };
  const runScan = () => { if (!preview) return; setScanning(true); setTimeout(() => { setScanning(false); setScanDone(true); }, 2400); };

  const handleNext = useCallback(() => {
    if (!preview) return;
    sessionStorage.setItem('medusa_selfie', preview);
    router.push('/start/look');
  }, [preview, router]);

  useEffect(() => { if (scanDone) { const t = setTimeout(handleNext, 550); return () => clearTimeout(t); } }, [scanDone, handleNext]);
  useEffect(() => () => { stream?.getTracks().forEach(t => t.stop()); }, [stream]);

  const corner = (pos: React.CSSProperties) => (
    <div style={{ position:'absolute', width:18, height:18, ...pos }} />
  );
  const accentBorder = 'var(--accent)';

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
      <Navbar />
      <main style={{ paddingTop:'calc(var(--nav-h) + 64px)', paddingBottom:80 }}>
        <div className="wrap" style={{ maxWidth:580, margin:'0 auto' }}>

          <div className="anim-fade-up" style={{ marginBottom:48, textAlign:'center' }}>
            <span className="tag" style={{ marginBottom:20, display:'inline-flex' }}>Step 01 of 03</span>
            <h1 className="serif" style={{ fontSize:'clamp(42px, 7vw, 72px)', lineHeight:0.93, letterSpacing:'-0.025em', marginBottom:16 }}>
              Show us<br /><em className="serif-italic" style={{ color:'var(--accent)' }}>your face.</em>
            </h1>
            <p style={{ fontSize:14, color:'var(--text-2)', lineHeight:1.8, fontWeight:300, maxWidth:320, margin:'0 auto' }}>
              Any lighting. Any angle. Claude AI reads your skin tone, undertone and bone structure.
            </p>
          </div>

          {!preview && mode === 'upload' && (
            <div className="anim-fade-up-d1">
              <div
                className={`upload-zone${isDragging ? ' drag' : ''}`}
                style={{ padding:'56px 24px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:20, marginBottom:16 }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
              >
                <div className="anim-float" style={{ width:72, height:72, borderRadius:'50%', background:'var(--accent-tint)', border:'1px solid rgba(181,96,74,.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="15" r="8" stroke="rgba(181,96,74,.7)" strokeWidth="1.5"/>
                    <path d="M6 32c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="rgba(181,96,74,.4)" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="15" cy="14" r="1.5" fill="rgba(181,96,74,.6)"/><circle cx="21" cy="14" r="1.5" fill="rgba(181,96,74,.6)"/>
                  </svg>
                </div>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontSize:15, color:'var(--text)', fontWeight:500, marginBottom:4 }}>Drop your photo here</p>
                  <p style={{ fontSize:13, color:'var(--text-2)' }}>or click to browse · JPG, PNG, WEBP</p>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={onInputChange} />

              <div style={{ display:'flex', alignItems:'center', gap:16, margin:'16px 0' }}>
                <div className="line-gradient" style={{ flex:1 }}/>
                <span style={{ fontSize:11, color:'var(--text-3)', letterSpacing:'0.1em' }}>OR</span>
                <div className="line-gradient" style={{ flex:1 }}/>
              </div>

              <button onClick={startCamera} className="btn btn-ghost" style={{ width:'100%', gap:10, justifyContent:'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Take a selfie with camera
              </button>

              <div style={{ marginTop:24, display:'flex', flexDirection:'column', gap:7 }}>
                {['Face front-facing, good natural light','Remove glasses if possible','No filters — AI needs your real skin'].map((tip,i) => (
                  <p key={i} style={{ fontSize:12, color:'var(--text-3)', display:'flex', gap:8, alignItems:'flex-start' }}>
                    <span style={{ color:'var(--accent)', flexShrink:0 }}>✦</span>{tip}
                  </p>
                ))}
              </div>
            </div>
          )}

          {mode === 'camera' && !preview && (
            <div className="anim-fade-in" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
              <div style={{ position:'relative', width:'100%', maxWidth:360, aspectRatio:'3/4', borderRadius:20, overflow:'hidden', border:'1.5px solid var(--line)' }}>
                <video ref={vidRef} style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)' }} playsInline muted />
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                  <div style={{ width:'55%', height:'72%', border:'1.5px solid rgba(181,96,74,.45)', borderRadius:'50%' }}/>
                </div>
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <button onClick={capturePhoto} className="btn btn-dark">Capture →</button>
                <button onClick={stopCamera}   className="btn btn-ghost">Cancel</button>
              </div>
            </div>
          )}

          {preview && (
            <div className="anim-fade-in" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:24 }}>
              <div style={{ position:'relative', width:'100%', maxWidth:340, aspectRatio:'3/4', borderRadius:20, overflow:'hidden', border:'1.5px solid var(--line)', boxShadow:'0 24px 60px rgba(28,20,16,.10)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Selfie" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>

                {scanning && (
                  <div style={{ position:'absolute', inset:0, background:'rgba(250,246,241,.82)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'1.5px', background:`linear-gradient(90deg, transparent, ${accentBorder}, transparent)`, animation:'scanLine 1.3s ease-in-out infinite' }}/>
                    {corner({ top:16, left:16,  borderTop:`1.5px solid ${accentBorder}`, borderLeft:`1.5px solid ${accentBorder}` })}
                    {corner({ top:16, right:16, borderTop:`1.5px solid ${accentBorder}`, borderRight:`1.5px solid ${accentBorder}` })}
                    {corner({ bottom:16, left:16,  borderBottom:`1.5px solid ${accentBorder}`, borderLeft:`1.5px solid ${accentBorder}` })}
                    {corner({ bottom:16, right:16, borderBottom:`1.5px solid ${accentBorder}`, borderRight:`1.5px solid ${accentBorder}` })}
                    <div style={{ display:'flex', gap:8, marginTop:64 }}>
                      {[0,1,2].map(j => <span key={j} className="pulse-dot" style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', display:'inline-block', animationDelay:`${j*.2}s` }}/>)}
                    </div>
                    <p style={{ fontSize:11, color:'var(--text-2)', letterSpacing:'0.14em', textTransform:'uppercase' }}>Reading your features</p>
                  </div>
                )}

                {scanDone && (
                  <div style={{ position:'absolute', inset:0, background:'rgba(250,246,241,.72)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10 }}>
                    <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 24px rgba(181,96,74,.28)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p style={{ fontSize:13, color:'var(--text)', fontWeight:500 }}>Ready ✦</p>
                  </div>
                )}
              </div>

              {!scanning && !scanDone && (
                <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
                  <button onClick={runScan}                className="btn btn-dark btn-lg">Analyse my face →</button>
                  <button onClick={() => setPreview(null)} className="btn btn-ghost">Retake</button>
                </div>
              )}
              {scanning && <p style={{ fontSize:13, color:'var(--text-2)' }}>Reading your features…</p>}
            </div>
          )}

          <style>{`@keyframes scanLine { 0%{top:0;opacity:.9} 60%{opacity:1} 100%{top:100%;opacity:0} }`}</style>
        </div>
      </main>
    </div>
  );
}
