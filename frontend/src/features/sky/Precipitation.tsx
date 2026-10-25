import { useEffect, useRef } from 'react'
import { clamp, lerp } from './color'
import styles from './SkyScene.module.css'

export interface PrecipitationProps {
  kind: 'rain' | 'snow'
  /** 0–1 */
  intensity: number
  /** 0–1: wind, which slants rain and sways snow. */
  wind: number
  /** Stops the animation (hidden tab, reduced motion). */
  paused: boolean
}

interface Particle {
  x: number
  y: number
  speed: number
  size: number
  phase: number
}

const MAX_DPR = 2
const MAX_FRAME_S = 0.05

/**
 * Rain and snow on a canvas. Particle counts scale with intensity and canvas size and are capped,
 * the loop stops when `paused`, and nothing is drawn when the canvas is unavailable.
 */
export function Precipitation({ kind, intensity, wind, paused }: PrecipitationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    let width = 0
    let height = 0
    let particles: Particle[] = []
    let frame = 0
    let last = 0

    const slant = lerp(0.05, 0.4, wind) // horizontal travel per unit of fall (rain)
    const random = Math.random

    const spawn = (anywhere: boolean): Particle => ({
      x: random() * (width + height * slant) - height * slant,
      y: anywhere ? random() * height : -20,
      speed: kind === 'rain' ? lerp(520, 900, random()) : lerp(35, 85, random()),
      size: kind === 'rain' ? lerp(8, 18, random()) : lerp(1, 3.2, random()),
      phase: random() * Math.PI * 2,
    })

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.max(1, Math.round(width * ratio))
      canvas.height = Math.max(1, Math.round(height * ratio))
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      const density = kind === 'rain' ? lerp(60, 320, intensity) : lerp(40, 180, intensity)
      const count = Math.round(density * clamp((width * height) / (1200 * 600), 0.35, 1.4))
      particles = Array.from({ length: count }, () => spawn(true))
    }

    const draw = (time: number) => {
      const dt = Math.min((time - last) / 1000, MAX_FRAME_S)
      last = time
      context.clearRect(0, 0, width, height)

      if (kind === 'rain') {
        context.lineWidth = 1
        context.strokeStyle = `rgba(205, 225, 255, ${lerp(0.28, 0.5, intensity)})`
        context.beginPath()
        for (const drop of particles) {
          drop.y += drop.speed * dt
          drop.x += drop.speed * slant * dt
          if (drop.y > height) Object.assign(drop, spawn(false))
          context.moveTo(drop.x, drop.y)
          context.lineTo(drop.x + drop.size * slant, drop.y + drop.size)
        }
        context.stroke()
      } else {
        context.fillStyle = 'rgba(255, 255, 255, 0.85)'
        for (const flake of particles) {
          flake.y += flake.speed * dt
          flake.phase += dt
          flake.x += Math.sin(flake.phase) * lerp(8, 30, wind) * dt
          if (flake.y > height) Object.assign(flake, spawn(false))
          context.beginPath()
          context.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2)
          context.fill()
        }
      }
      frame = requestAnimationFrame(draw)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    if (!paused) {
      last = performance.now()
      frame = requestAnimationFrame(draw)
    }

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      context.clearRect(0, 0, width, height)
    }
  }, [kind, intensity, wind, paused])

  return <canvas ref={canvasRef} className={styles.precipitation} />
}
