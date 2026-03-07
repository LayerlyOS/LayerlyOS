import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020617',
          borderRadius: '36px',
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 80 80"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="aiLg1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#C7C7E2" />
            </linearGradient>
            <linearGradient id="aiLg2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9494C8" />
              <stop offset="100%" stopColor="#5A5AA8" />
            </linearGradient>
            <linearGradient id="aiLg3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B3B8A" />
              <stop offset="100%" stopColor="#0D0D2B" />
            </linearGradient>
          </defs>
          {/* <rect width="80" height="80" fill="#09090B" /> */}
          <path d="M23.92,11.65 L75.00,11.65 L63.65,26.79 L12.57,26.79 Z" fill="url(#aiLg1)" />
          <path d="M20.14,32.46 L71.21,32.46 L59.86,47.59 L8.79,47.59 Z" fill="url(#aiLg2)" />
          <path d="M16.35,53.28 L67.43,53.28 L56.08,68.41 L5.00,68.41 Z" fill="url(#aiLg3)" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
