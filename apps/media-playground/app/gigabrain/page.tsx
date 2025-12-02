'use client'

import FlippingText from '@/components/flipping-text'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

export default function GigabrainPage() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.75
    }
  }, [])

  return (
    <div className="min-h-full bg-black">
      {/* Background Video - Fixed */}
      <video
        ref={videoRef}
        className="fixed inset-0 w-full h-full object-cover opacity-60"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src="/gigabrain_banner.mp4" type="video/mp4" />
      </video>

      {/* Content Overlay */}
      <div className="relative z-10 min-h-full">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-32 min-h-[60vh] flex flex-col items-center justify-center">
              <h1
                className="text-6xl md:text-7xl font-bold mb-28 mt-12 leading-tight"
                style={{
                  fontFamily:
                    'var(--font-kumar-one), "Courier Prime", "Courier New", monospace',
                  color: '#f5b800',
                  textShadow: '4px 4px 10px rgba(0, 0, 0, 0.9)',
                  WebkitTextFillColor: '#f5b800',
                }}
              >
                gigabrain
              </h1>
              <div
                className="text-3xl md:text-4xl text-white leading-relaxed max-w-3xl mx-auto mb-16"
                style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}
              >
                <FlippingText
                  baseText="A collective mind for your community."
                  words={[
                    'organisation.',
                    'discord server.',
                    'community.',
                    'neighbourhood.',
                  ]}
                  interval={2500}
                  className="text-2xl md:text-3xl text-white leading-relaxed"
                />
              </div>

              {/* CTA Button */}
              <div className="mt-12">
                <Link
                  href="/gigabrain/onboarding/chat"
                  className="inline-flex items-center justify-center rounded-lg px-8 py-4 text-lg font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #e6a825, #7c8aff)',
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  Create your Gigabrain
                </Link>
                <p className="text-sm text-gray-300 mt-4">Takes 5 minutes</p>
              </div>
            </div>

            {/* Process Steps */}
            <div className="flex items-center md:justify-center gap-4 mb-24 overflow-x-auto snap-x snap-mandatory md:overflow-visible px-4 md:px-0 -mx-4 md:mx-0 scrollbar-hide pt-6">
              {/* Step 1 */}
              <div className="flex-1 min-w-[85vw] md:min-w-0 max-w-xs bg-black/60 rounded-xl p-6 border border-yellow-400/20 backdrop-blur-sm transition-all duration-300 hover:border-yellow-400/40 hover:transform hover:-translate-y-1 relative snap-center mt-4">
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-black text-sm">
                  1
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-purple-400/60 flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2 text-yellow-400">
                  Create Persona
                </h3>
                <p className="text-sm text-gray-300">
                  Define your community's voice, values, and personality
                </p>
              </div>

              {/* Arrow 1 */}
              <div className="flex-shrink-0 text-yellow-400/60">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>

              {/* Step 2 */}
              <div className="flex-1 min-w-[85vw] md:min-w-0 max-w-xs bg-black/60 rounded-xl p-6 border border-yellow-400/20 backdrop-blur-sm transition-all duration-300 hover:border-yellow-400/40 hover:transform hover:-translate-y-1 relative snap-center mt-4">
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-black text-sm">
                  2
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-purple-400/60 flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2 text-yellow-400">
                  Add Knowledge
                </h3>
                <p className="text-sm text-gray-300">
                  Connect your channels and upload context about your community
                </p>
              </div>

              {/* Arrow 2 */}
              <div className="flex-shrink-0 text-yellow-400/60">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>

              {/* Step 3 */}
              <div className="flex-1 min-w-[85vw] md:min-w-0 max-w-xs bg-black/60 rounded-xl p-6 border border-yellow-400/20 backdrop-blur-sm transition-all duration-300 hover:border-yellow-400/40 hover:transform hover:-translate-y-1 relative snap-center mt-4">
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-black text-sm">
                  3
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-purple-400/60 flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2 text-yellow-400">Deploy</h3>
                <p className="text-sm text-gray-300">
                  Connect to Discord, Twitter, and other platforms
                </p>
              </div>
            </div>

            {/* Key Features */}
            <div className="space-y-6 mb-24">
              <div className="bg-black/60 rounded-xl p-8 border border-purple-500/15 backdrop-blur-sm transition-all duration-300 hover:border-purple-400/30">
                <div className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-purple-400/60 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-yellow-400">
                      Event Orchestration
                    </h3>
                    <p className="text-gray-300">
                      Engage members based on their skills and passions.
                      Coordinate meaningful gatherings that bring your community
                      together.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/60 rounded-xl p-8 border border-purple-500/15 backdrop-blur-sm transition-all duration-300 hover:border-purple-400/30">
                <div className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-purple-400/60 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-yellow-400">
                      Collective Memory
                    </h3>
                    <p className="text-gray-300">
                      Integrate information across all your channels. Create
                      persistent context so valuable insights are never lost.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/60 rounded-xl p-8 border border-purple-500/15 backdrop-blur-sm transition-all duration-300 hover:border-purple-400/30">
                <div className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-purple-400/60 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-yellow-400">
                      Amplify Your Voice
                    </h3>
                    <p className="text-gray-300">
                      Generate social content, create recaps, and produce media
                      that maintains your community's unique voice and style.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-black/60 rounded-xl p-8 border border-yellow-400/20 backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-6 text-yellow-400">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                <details className="group border-b border-gray-700 pb-4">
                  <summary className="font-semibold cursor-pointer list-none flex items-center justify-between py-2 text-white">
                    What will I need?
                    <svg
                      className="w-5 h-5 transition-transform group-open:rotate-180 text-yellow-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <p className="text-gray-300 mt-2 pl-0">
                    Just basic information about your community: who you are,
                    what you do, and your vibe. Optionally, you can connect your
                    Discord or other channels to enhance your gigabrain's
                    memory.
                  </p>
                </details>

                <details className="group border-b border-gray-700 pb-4">
                  <summary className="font-semibold cursor-pointer list-none flex items-center justify-between py-2 text-white">
                    Can I change this later?
                    <svg
                      className="w-5 h-5 transition-transform group-open:rotate-180 text-yellow-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <p className="text-gray-300 mt-2 pl-0">
                    Absolutely! Everything can be refined, updated, or changed
                    at any time. Your gigabrain evolves with your community.
                  </p>
                </details>

                <details className="group">
                  <summary className="font-semibold cursor-pointer list-none flex items-center justify-between py-2 text-white">
                    What does gigabrain actually do?
                    <svg
                      className="w-5 h-5 transition-transform group-open:rotate-180 text-yellow-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <p className="text-gray-300 mt-2 pl-0">
                    Gigabrain is your community's AI-powered collective
                    intelligence. It helps coordinate events, preserves
                    community knowledge across channels, facilitates consensus
                    building, and creates content that reflects your community's
                    unique voice.
                  </p>
                </details>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center mt-12 pb-12">
              <p className="text-sm text-white">
                You own your data. Private by default.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
