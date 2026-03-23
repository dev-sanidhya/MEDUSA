'use client';

/**
 * MakeupPreview
 *
 * Renders the user's selfie on a <canvas> with progressive makeup layers.
 * Uses REAL face landmark coordinates returned by Claude Vision API
 * so makeup is placed exactly on the user's eyes, lips, cheeks etc —
 * regardless of face position, zoom, or angle in the photo.
 */

import { useEffect, useRef, useState } from 'react';
import { renderMakeupOnCanvas, type FaceLandmarks } from '@/lib/makeup-canvas';

interface Props {
  selfie:     string;             // base64 data URL
  lookId:     string;
  zones:      string[];           // zone per step, accumulated up to activeStep
  landmarks:  FaceLandmarks | null; // Claude Vision coordinates, null = use estimate
  stepIndex:  number;
  totalSteps: number;
}

export default function MakeupPreview({ selfie, lookId, zones, landmarks, stepIndex, totalSteps }: Props) {
  const canvasRef           = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  // Stable string key so the dep array size never changes as zones grows
  const zonesKey = zones.join(',');

  useEffect(() => {
    if (!selfie || !canvasRef.current) return;
    setLoading(true);
    setError(false);
    // zones captured via closure — zonesKey drives the re-run
    renderMakeupOnCanvas(canvasRef.current, selfie, lookId, zones, landmarks)
      .then(() => setLoading(false))
      .catch(() => { setLoading(false); setError(true); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfie, lookId, zonesKey, landmarks]);

  const progressPct = totalSteps > 0 ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0;
  const usingRealLandmarks = landmarks !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>

      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <p style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 500 }}>
            Your Result
          </p>
          {/* Indicator: real landmarks vs estimate */}
          <span style={{
            fontSize: 9, padding: '2px 7px', borderRadius: 100,
            background: usingRealLandmarks ? 'rgba(34,197,94,0.10)' : 'var(--bg-surface)',
            color: usingRealLandmarks ? '#15803d' : 'var(--text-3)',
            border: `1px solid ${usingRealLandmarks ? 'rgba(34,197,94,0.25)' : 'var(--line)'}`,
            fontWeight: 500, letterSpacing: '0.04em',
          }}>
            {usingRealLandmarks ? '✦ AI-placed' : '~ estimated'}
          </span>
        </div>
        <span style={{
          fontSize: 10, padding: '3px 11px', borderRadius: 100,
          background: 'var(--accent-tint)', color: 'var(--accent-lo)',
          border: '1px solid rgba(181,96,74,.25)', fontWeight: 500, letterSpacing: '0.06em',
        }}>
          After step {stepIndex + 1}
        </span>
      </div>

      {/* Canvas container */}
      <div style={{
        position: 'relative',
        borderRadius: 20,
        overflow: 'hidden',
        background: 'var(--bg-surface)',
        border: '1px solid var(--line)',
        aspectRatio: '3 / 4',
        flexShrink: 0,
      }}>
        {/* Canvas with makeup overlay */}
        <canvas
          ref={canvasRef}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            display: loading ? 'none' : 'block',
          }}
        />

        {/* Raw photo while canvas paints */}
        {loading && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selfie} alt="Your photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}

        {/* Loading shimmer */}
        {loading && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(250,246,241,0.60)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map(i => (
                <span key={i} className="pulse-dot" style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: 'var(--accent)', animationDelay: `${i * 0.2}s`,
                }} />
              ))}
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-2)', letterSpacing: '0.12em' }}>
              Applying makeup…
            </p>
          </div>
        )}

        {/* Error fallback — show raw photo */}
        {error && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selfie} alt="Your photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}

        {/* Progress badge — bottom left */}
        <div style={{
          position: 'absolute', bottom: 14, left: 14,
          background: 'rgba(250,246,241,0.90)',
          backdropFilter: 'blur(8px)',
          borderRadius: 10, padding: '7px 12px',
          border: '1px solid rgba(229,221,213,0.7)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 48, height: 2, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progressPct}%`,
              background: 'var(--accent)', transition: 'width 0.6s ease',
            }} />
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 500 }}>
            {progressPct}%
          </span>
        </div>

        {/* Layers applied badge — bottom right */}
        {!loading && stepIndex > 0 && (
          <div style={{
            position: 'absolute', bottom: 14, right: 14,
            background: 'var(--accent)', color: '#fff',
            borderRadius: 10, padding: '6px 11px',
            fontSize: 9, fontWeight: 500, letterSpacing: '0.08em',
          }}>
            {stepIndex} layer{stepIndex !== 1 ? 's' : ''} applied
          </div>
        )}
      </div>
    </div>
  );
}
