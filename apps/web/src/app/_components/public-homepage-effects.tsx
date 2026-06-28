'use client';

import Link from 'next/link';
import {
  MouseEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

export function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      if (scrollableHeight <= 0) {
        setProgress(0);
        return;
      }

      setProgress(window.scrollY / scrollableHeight);
    };

    updateProgress();

    window.addEventListener('scroll', updateProgress, {
      passive: true,
    });
    window.addEventListener('resize', updateProgress);

    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="iqm-scroll-progress"
      style={{
        transform: `scaleX(${progress})`,
      }}
    />
  );
}

export function PublicCursorGlow() {
  const [position, setPosition] = useState({
    x: -500,
    y: -500,
  });

  useEffect(() => {
    const updatePosition = (event: PointerEvent) => {
      setPosition({
        x: event.clientX,
        y: event.clientY,
      });
    };

    window.addEventListener('pointermove', updatePosition, {
      passive: true,
    });

    return () => {
      window.removeEventListener('pointermove', updatePosition);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="iqm-cursor-glow"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0) translate3d(-50%, -50%, 0)`,
      }}
    />
  );
}

type MagneticLinkProps = {
  children: ReactNode;
  className: string;
  href: string;
  onClick?: () => void;
};

export function MagneticLink({
  children,
  className,
  href,
  onClick,
}: MagneticLinkProps) {
  const linkRef = useRef<HTMLAnchorElement | null>(null);

  const handlePointerMove = (event: MouseEvent<HTMLAnchorElement>) => {
    const element = linkRef.current;

    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;

    element.style.setProperty('--iqm-mx', `${x * 0.16}px`);
    element.style.setProperty('--iqm-my', `${y * 0.16}px`);
  };

  const handlePointerLeave = () => {
    const element = linkRef.current;

    if (!element) {
      return;
    }

    element.style.setProperty('--iqm-mx', '0px');
    element.style.setProperty('--iqm-my', '0px');
  };

  const sharedProps = {
    className: `iqm-magnetic ${className}`,
    onClick,
    onMouseLeave: handlePointerLeave,
    onMouseMove: handlePointerMove,
    ref: linkRef,
  };

  if (href.startsWith('#') || href.startsWith('http')) {
    return (
      <a href={href} {...sharedProps}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} {...sharedProps}>
      {children}
    </Link>
  );
}

export function AnimatedNumber({
  value,
  suffix = '',
}: {
  value: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [displayValue, setDisplayValue] = useState(0);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

   const observer = new IntersectionObserver(
  (entries) => {
    const entry = entries[0];

    if (!entry || !entry.isIntersecting || hasRun) {
      return;
    }

        setHasRun(true);

        const start = performance.now();
        const duration = 1100;

        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);

          setDisplayValue(Math.round(value * eased));

          if (progress < 1) {
            window.requestAnimationFrame(tick);
          }
        };

        window.requestAnimationFrame(tick);
      },
      {
        threshold: 0.35,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasRun, value]);

  return (
    <span ref={ref}>
      {displayValue}
      {suffix}
    </span>
  );
}

export function TimelineRail() {
  return (
    <div
      aria-hidden="true"
      className="iqm-timeline-rail absolute left-0 top-0 hidden h-full w-px rounded-full lg:block"
    />
  );
}

const consoleLines = [
  {
    label: 'session.capture',
    value: 'responses + timing + omissions',
  },
  {
    label: 'scoring.engine',
    value: 'raw → domain → provisional IRT',
  },
  {
    label: 'validity.flags',
    value: 'omission + timing coverage checked',
  },
  {
    label: 'profile.output',
    value: 'standard score + percentile + interval',
  },
  {
    label: 'governance.audit',
    value: 'traceable scoring event persisted',
  },
];

export function SignalConsole() {
  const [activeLine, setActiveLine] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveLine((current) => (current + 1) % consoleLines.length);
    }, 1350);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-[#070b1f] p-5">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            IQMeridian signal console
          </p>
          <p className="mt-2 text-sm text-blue-50/55">
            Simulated product telemetry preview
          </p>
        </div>

        <div className="flex gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {consoleLines.map((line, index) => {
          const isActive = activeLine === index;

          return (
            <div
              className={`iqm-console-line rounded-2xl border px-4 py-3 font-mono text-xs transition ${
                isActive
                  ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100'
                  : 'border-white/10 bg-white/[0.04] text-blue-50/58'
              }`}
              key={line.label}
              style={{
                animationDelay: `${index * 90}ms`,
              }}
            >
              <span className="text-cyan-300">{line.label}</span>
              <span className="text-blue-50/35"> :: </span>
              <span>{line.value}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex h-28 items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        {[44, 71, 58, 86, 63, 92, 74, 68, 81, 55, 88, 77].map(
          (height, index) => (
            <span
              className="iqm-data-bar flex-1 rounded-t-md bg-cyan-300/70"
              key={`${height}-${index}`}
              style={{
                animationDelay: `${index * 70}ms`,
                height: `${height}%`,
              }}
            />
          )
        )}
      </div>
    </div>
  );
}


export function HeroSignalParticles() {
  const particles = [
    { top: 18, delay: 0 },
    { top: 28, delay: 0.65 },
    { top: 42, delay: 1.25 },
    { top: 56, delay: 1.85 },
    { top: 67, delay: 2.45 },
    { top: 35, delay: 3.05 },
    { top: 49, delay: 3.55 },
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-[35%] top-[36%] z-[1] hidden h-56 w-[34rem] lg:block"
    >
      <div className="absolute left-0 top-[24%] h-px w-full bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />
      <div className="absolute left-0 top-[48%] h-px w-full bg-gradient-to-r from-transparent via-blue-300/18 to-transparent" />
      <div className="absolute left-0 top-[66%] h-px w-full bg-gradient-to-r from-transparent via-emerald-300/18 to-transparent" />

      <div className="absolute left-[18%] top-[24%] h-14 w-px bg-gradient-to-b from-transparent via-cyan-300/25 to-transparent" />
      <div className="absolute left-[47%] top-[37%] h-16 w-px bg-gradient-to-b from-transparent via-blue-300/20 to-transparent" />
      <div className="absolute left-[76%] top-[52%] h-14 w-px bg-gradient-to-b from-transparent via-emerald-300/20 to-transparent" />

      {particles.map((particle, index) => (
        <span
          className="iqm-hero-signal-particle absolute h-1.5 w-1.5 rounded-full bg-cyan-300"
          key={`${particle.top}-${particle.delay}`}
          style={{
            animationDelay: `${particle.delay}s`,
            top: `${particle.top}%`,
          }}
        >
          {index % 2 === 0 ? (
            <span className="absolute inset-0 rounded-full bg-cyan-200/40 blur-sm" />
          ) : null}
        </span>
      ))}
    </div>
  );
}

export function AmbientSignalConduit({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute hidden h-40 w-72 lg:block ${className}`}
    >
      <div className="absolute left-8 top-1/2 h-px w-56 bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" />
      <div className="absolute left-16 top-[32%] h-px w-32 bg-gradient-to-r from-transparent via-blue-300/22 to-transparent" />
      <div className="absolute left-24 top-[68%] h-px w-36 bg-gradient-to-r from-transparent via-emerald-300/18 to-transparent" />

      <div className="absolute left-16 top-[32%] h-14 w-px bg-gradient-to-b from-transparent via-cyan-300/22 to-transparent" />
      <div className="absolute left-40 top-[48%] h-16 w-px bg-gradient-to-b from-transparent via-blue-300/18 to-transparent" />

      <span className="iqm-ambient-node iqm-circuit-ring absolute left-7 top-[calc(50%-0.4rem)] h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.75)]" />
      <span className="iqm-ambient-node absolute left-20 top-[calc(32%-0.35rem)] h-2.5 w-2.5 rounded-full bg-blue-300 shadow-[0_0_14px_rgba(147,197,253,0.65)]" />
      <span className="iqm-ambient-node absolute left-40 top-[calc(68%-0.35rem)] h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.55)]" />
      <span className="iqm-ambient-node absolute left-60 top-[calc(50%-0.35rem)] h-2.5 w-2.5 rounded-full bg-cyan-200 shadow-[0_0_14px_rgba(165,243,252,0.65)]" />

      {[0, 0.9, 1.8, 2.7].map((delay, index) => (
        <span
          className="iqm-ambient-signal-particle absolute top-[calc(50%-0.2rem)] h-1.5 w-1.5 rounded-full bg-cyan-300"
          key={`${delay}-${index}`}
          style={{
            animationDelay: `${delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export function PublicReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry?.isIntersecting) {
          setVisible(true);
          observer.unobserve(element);
        }
      },
      {
        rootMargin: '-8% 0px -12% 0px',
        threshold: 0.14,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`iqm-reveal ${className}`}
      data-visible={visible ? 'true' : 'false'}
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}