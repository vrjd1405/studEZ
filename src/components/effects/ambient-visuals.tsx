'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import LightTunnel from '@/components/ui/light-tunnel'
import GlowCursor from '@/components/ui/glow-cursor'

export function AmbientVisuals() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const isDark = resolvedTheme !== 'light'

  return (
    <>
      {/* Background LightTunnel - Ultra-optimized background shader */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none transition-opacity duration-1000"
        aria-hidden="true"
        style={{ opacity: mounted ? 1 : 0 }}
      >
        <LightTunnel
          cableColor={isDark ? '#A855F7' : '#7C3AED'}
          pulseColor={isDark ? '#67E8F9' : '#0284C7'}
          tunnelColor={isDark ? '#180B2D' : '#F3E8FF'}
          tunnelOpacity={0}
          speed={0.08}
          flowDirection="outward"
          pulseSpeed={1.8}
          pulseLength={0.28}
          pulseBlend={1}
          pulseWidth={1}
          cableCount={18}
          thickness={0.32}
          rimWidth={0.14}
          waviness={0.25}
          sway={0.4}
          size={1.05}
          centerX={0.0}
          centerY={0.0}
          glow={isDark ? 1.15 : 0.75}
          fadeNear={0.45}
          fadeFar={2.2}
          brightness={isDark ? 1.0 : 0.8}
          colorVariance={true}
          grain={true}
          grainIntensity={0.03}
          opacity={isDark ? 0.38 : 0.14}
          mouseInteraction={true}
          mouseStrength={0.07}
          lightMode={!isDark}
        />
        {/* Soft gradient wash to ensure text readability */}
        <div
          className={`absolute inset-0 pointer-events-none ${
            isDark
              ? 'bg-gradient-to-t from-background via-background/40 to-background/60'
              : 'bg-gradient-to-t from-background/90 via-background/60 to-background/70'
          }`}
        />
      </div>

      {/* Foreground GlowCursor - Fluid cursor trail that never blocks clicks */}
      <GlowCursor
        color={isDark ? '#67E8F9' : '#0284C7'}
        secondaryColor={isDark ? '#A78BFA' : '#7C3AED'}
        trailLength={36}
        trailWidth={7}
        trailTaper={0.8}
        followSpeed={0.18}
        glowIntensity={isDark ? 1.85 : 1.3}
        glowSpread={1.2}
        hotspot={0.65}
        brightness={isDark ? 1.2 : 0.95}
        opacity={isDark ? 0.95 : 0.7}
        pulseSpeed={1.0}
        noiseStrength={0.03}
        idleFade={true}
        idleTimeout={700}
        fadeDuration={850}
        blendMode={isDark ? 'screen' : 'normal'}
        maxDevicePixelRatio={1.25}
        className="fixed inset-0 pointer-events-none z-[99999]"
      />
    </>
  )
}

export default AmbientVisuals
