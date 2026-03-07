import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Layerly.cloud - 3D Print Cost Calculator & Inventory Manager';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  let fontList: ArrayBuffer[] = [];
  try {
    const [semiBold, bold] = await Promise.all([
      fetch('https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-600-normal.woff').then((r) =>
        r.ok ? r.arrayBuffer() : Promise.reject(new Error('font 600'))
      ),
      fetch('https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-700-normal.woff').then((r) =>
        r.ok ? r.arrayBuffer() : Promise.reject(new Error('font 700'))
      ),
    ]);
    fontList = [semiBold, bold];
  } catch {
    // fallback without custom font – we still return image
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#020617', // slate-950
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Background Glow */}
        <div
          style={{
            position: 'absolute',
            width: '900px',
            height: '900px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 60%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Decorative Corners */}
        <div style={{ position: 'absolute', top: 60, left: 60, width: 60, height: 4, background: '#4f46e5' }} />
        <div style={{ position: 'absolute', top: 60, left: 60, width: 4, height: 60, background: '#4f46e5' }} />
        
        <div style={{ position: 'absolute', top: 60, right: 60, width: 60, height: 4, background: '#4f46e5' }} />
        <div style={{ position: 'absolute', top: 60, right: 60, width: 4, height: 60, background: '#4f46e5' }} />

        <div style={{ position: 'absolute', bottom: 60, left: 60, width: 60, height: 4, background: '#4f46e5' }} />
        <div style={{ position: 'absolute', bottom: 60, left: 60, width: 4, height: 60, background: '#4f46e5' }} />

        <div style={{ position: 'absolute', bottom: 60, right: 60, width: 60, height: 4, background: '#4f46e5' }} />
        <div style={{ position: 'absolute', bottom: 60, right: 60, width: 4, height: 60, background: '#4f46e5' }} />

        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
          
          {/* Logo: icon in SVG + text in div (Satori renders div better than SVG text) */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 50 }}>
            <svg
              width="100"
              height="100"
              viewBox="0 0 80 80"
              xmlns="http://www.w3.org/2000/svg"
              style={{ flexShrink: 0, marginRight: 24 }}
            >
              <defs>
                <linearGradient id="ogLg1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#C7C7E2" />
                </linearGradient>
                <linearGradient id="ogLg2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9494C8" />
                  <stop offset="100%" stopColor="#5A5AA8" />
                </linearGradient>
                <linearGradient id="ogLg3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B3B8A" />
                  <stop offset="100%" stopColor="#0D0D2B" />
                </linearGradient>
              </defs>
              {/* <rect width="80" height="80" fill="#09090B" /> */}
              <path d="M23.92,11.65 L75.00,11.65 L63.65,26.79 L12.57,26.79 Z" fill="url(#ogLg1)" />
              <path d="M20.14,32.46 L71.21,32.46 L59.86,47.59 L8.79,47.59 Z" fill="url(#ogLg2)" />
              <path d="M16.35,53.28 L67.43,53.28 L56.08,68.41 L5.00,68.41 Z" fill="url(#ogLg3)" />
            </svg>
            <div
              style={{
                fontSize: 80,
                fontWeight: 700,
                fontFamily: fontList.length === 2 ? 'Outfit, system-ui, sans-serif' : 'system-ui, sans-serif',
                letterSpacing: '-0.04em',
                color: 'white',
                display: 'flex',
                alignItems: 'baseline',
              }}
            >
              Layerly<span style={{ color: '#5C3DE6', marginLeft: 2 }}>.</span>
            </div>
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 26,
              fontFamily: 'Outfit',
              fontWeight: 600,
              color: '#94a3b8',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            Cost Calculator & Inventory Manager
          </div>
        </div>

        {/* Footer Meta */}
         <div style={{ position: 'absolute', bottom: 60, width: '100%', display: 'flex', justifyContent: 'center', fontSize: 16, color: '#334155', letterSpacing: '0.2em', fontFamily: 'Outfit', fontWeight: 600 }}>
           SYSTEM ONLINE &nbsp;|&nbsp; EST. 2026 &nbsp;|&nbsp; LAYERLY.CLOUD
        </div>
      </div>
    ),
    {
      ...size,
      ...(fontList.length === 2 && {
      fonts: [
        { name: 'Outfit', data: fontList[0], style: 'normal' as const, weight: 600 as const },
        { name: 'Outfit', data: fontList[1], style: 'normal' as const, weight: 700 as const },
      ],
    }),
    }
  );
}
