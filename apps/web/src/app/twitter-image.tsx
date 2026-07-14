import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'IQMeridian public platform preview';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function TwitterImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background:
          'radial-gradient(circle at 20% 24%, rgba(34,211,238,0.22), transparent 28%), radial-gradient(circle at 74% 38%, rgba(168,85,247,0.16), transparent 25%), linear-gradient(135deg, #020817 0%, #07142f 52%, #111b46 100%)',
        color: 'white',
        display: 'flex',
        fontFamily: 'Inter, Arial, sans-serif',
        height: '100%',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '76px',
        width: '100%',
      }}
    >
      <div
        style={{
          border: '1px solid rgba(34,211,238,0.24)',
          borderRadius: '44px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          padding: '58px',
          width: '1048px',
        }}
      >
        <div
          style={{
            color: '#67e8f9',
            fontSize: '24px',
            fontWeight: 900,
            letterSpacing: '0.32em',
          }}
        >
          IQMERIDIAN
        </div>

        <div
          style={{
            color: '#ffffff',
            fontSize: '74px',
            fontWeight: 950,
            letterSpacing: '-0.055em',
            lineHeight: 0.94,
            maxWidth: '900px',
          }}
        >
          Intelligence assessment infrastructure.
        </div>

        <div
          style={{
            color: '#cbd5e1',
            fontSize: '29px',
            lineHeight: 1.35,
            maxWidth: '900px',
          }}
        >
          Cognitive testing, psychometric scoring, validity diagnostics,
          dashboards, and research governance.
        </div>
      </div>
    </div>,
    size
  );
}
