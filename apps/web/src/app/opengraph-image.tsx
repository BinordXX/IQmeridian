import { siteConfig } from '@/lib/public-seo';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'IQMeridian intelligence assessment infrastructure';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background:
          'radial-gradient(circle at 16% 18%, rgba(34,211,238,0.22), transparent 28%), radial-gradient(circle at 82% 34%, rgba(59,130,246,0.20), transparent 25%), linear-gradient(135deg, #020817 0%, #07142f 46%, #111b46 100%)',
        color: 'white',
        display: 'flex',
        fontFamily: 'Inter, Arial, sans-serif',
        height: '100%',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '72px',
        position: 'relative',
        width: '100%',
      }}
    >
      <div
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          inset: 0,
          opacity: 0.45,
          position: 'absolute',
        }}
      />

      <div
        style={{
          border: '1px solid rgba(34,211,238,0.22)',
          borderRadius: '42px',
          boxShadow: '0 40px 120px rgba(0,0,0,0.45)',
          display: 'flex',
          flexDirection: 'column',
          height: '486px',
          justifyContent: 'space-between',
          padding: '52px',
          position: 'relative',
          width: '1056px',
        }}
      >
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          <div
            style={{
              alignItems: 'center',
              background: 'rgba(34,211,238,0.12)',
              border: '1px solid rgba(34,211,238,0.28)',
              borderRadius: '22px',
              color: '#a5f3fc',
              display: 'flex',
              fontSize: '34px',
              fontWeight: 900,
              height: '72px',
              justifyContent: 'center',
              width: '72px',
            }}
          >
            IQ
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                color: '#ffffff',
                fontSize: '31px',
                fontWeight: 900,
                letterSpacing: '0.28em',
              }}
            >
              IQMERIDIAN
            </div>
            <div
              style={{
                color: '#94a3b8',
                fontSize: '21px',
                marginTop: '8px',
              }}
            >
              Intelligence assessment infrastructure
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              color: '#67e8f9',
              fontSize: '22px',
              fontWeight: 900,
              letterSpacing: '0.26em',
              marginBottom: '22px',
            }}
          >
            STRUCTURED • VALIDATED • GOVERNED
          </div>

          <div
            style={{
              color: '#ffffff',
              fontSize: '68px',
              fontWeight: 950,
              letterSpacing: '-0.055em',
              lineHeight: 0.94,
              maxWidth: '900px',
            }}
          >
            Measure intelligence with structure, validity, and precision.
          </div>

          <div
            style={{
              color: '#cbd5e1',
              fontSize: '24px',
              lineHeight: 1.45,
              marginTop: '26px',
              maxWidth: '860px',
            }}
          >
            {siteConfig.description}
          </div>
        </div>
      </div>
    </div>,
    size
  );
}
