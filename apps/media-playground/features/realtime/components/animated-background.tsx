'use client'

import { FC } from 'react'

/**
 * Animated background with noticeable gradient motion
 * Uses CSS animations for performance (GPU-accelerated)
 */
const AnimatedBackground: FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Primary gradient orb */}
      <div
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-40 blur-3xl animate-float-slow"
        style={{
          background:
            'radial-gradient(circle, hsl(var(--primary) / 0.6) 0%, hsl(var(--primary) / 0.3) 50%, transparent 70%)',
        }}
      />

      {/* Secondary gradient orb */}
      <div
        className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] rounded-full opacity-35 blur-3xl animate-float-slower"
        style={{
          background:
            'radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, hsl(var(--primary) / 0.2) 50%, transparent 70%)',
          animationDelay: '3s',
        }}
      />

      {/* Tertiary accent orb */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl animate-float-medium"
        style={{
          background:
            'radial-gradient(circle, hsl(var(--primary) / 0.45) 0%, hsl(var(--primary) / 0.2) 50%, transparent 70%)',
          animationDelay: '1.5s',
        }}
      />

      <style jsx>{`
        @keyframes float-slow {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(60px, -60px) scale(1.15);
          }
          66% {
            transform: translate(-50px, 50px) scale(0.85);
          }
        }

        @keyframes float-slower {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-80px, 60px) scale(1.2);
          }
        }

        @keyframes float-medium {
          0%,
          100% {
            transform: translate(-50%, -50%) scale(1);
          }
          33% {
            transform: translate(calc(-50% - 50px), calc(-50% + 50px))
              scale(1.18);
          }
          66% {
            transform: translate(calc(-50% + 50px), calc(-50% - 40px))
              scale(0.82);
          }
        }

        :global(.animate-float-slow) {
          animation: float-slow 20s ease-in-out infinite;
        }

        :global(.animate-float-slower) {
          animation: float-slower 25s ease-in-out infinite;
        }

        :global(.animate-float-medium) {
          animation: float-medium 18s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default AnimatedBackground
