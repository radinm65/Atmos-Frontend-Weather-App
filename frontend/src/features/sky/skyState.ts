import type { ConditionCategory, WeatherCondition } from '../../domain/weather'
import { clamp, darken, desaturate, lerp, mix, smoothstep } from './color'

/**
 * Pure model of what the sky looks like. It turns a moment in time, the day's sunrise/sunset and
 * the weather into numbers and colours; the drawing code (SkyScene) only renders them. Nothing here
 * invents weather: unknown conditions produce a calm, neutral sky.
 */

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export interface SkyInput {
  /** The instant shown (ISO). */
  time: string
  /** IANA zone; only used to guess the time of day when sun times are missing. */
  timezone: string
  /** Sun times for the local day containing `time`. */
  sunrise: string | null
  sunset: string | null
  /** Neighbouring sun times, so the moon's night arc is smooth across midnight. */
  previousSunset?: string | null
  nextSunrise?: string | null
  isDay: boolean | null
  condition: WeatherCondition | null
  cloudCover: number | null
  windSpeed: number | null
}

export interface BodyPosition {
  /** 0 = left edge of the sky, 1 = right edge. */
  x: number
  /** 0 = horizon, 1 = highest point of the arc. */
  y: number
  /** 0 = hidden, 1 = fully visible. */
  visible: number
}

export interface SkyColors {
  top: string
  middle: string
  bottom: string
  /** Colour of the glow around the sun or moon and along the horizon. */
  glow: string
  /** Colour of the sun's disc: orange near the horizon, white high up. */
  sunCore: string
  cloud: string
  cloudShade: string
  /** Silhouette hills at the bottom of the scene. */
  hillFar: string
  hillNear: string
}

export interface SkyState {
  /** Sun height: 1 at noon, 0 at the horizon, negative at night (−1 at deepest night). */
  altitude: number
  sun: BodyPosition
  moon: BodyPosition
  colors: SkyColors
  /** 0–1. */
  stars: number
  cloudAmount: number
  precipitation: { kind: 'none' | 'rain' | 'snow'; intensity: number }
  fog: number
  lightning: boolean
  /** 0–1: how fast clouds drift. */
  windDrift: number
  condition: ConditionCategory
}

// ---------- palette ----------

interface Keyframe {
  altitude: number
  top: string
  middle: string
  bottom: string
  glow: string
}

/** Sky colours by sun height, from deepest night to high noon. Interpolated linearly. */
const PALETTE: readonly Keyframe[] = [
  { altitude: -1, top: '#04060f', middle: '#080d22', bottom: '#101936', glow: '#1a2650' },
  { altitude: -0.5, top: '#070d26', middle: '#101c4a', bottom: '#233570', glow: '#32478c' },
  { altitude: -0.2, top: '#121a4a', middle: '#3a3d86', bottom: '#935d92', glow: '#e07a6c' },
  { altitude: -0.04, top: '#26346f', middle: '#8a5f9c', bottom: '#f27d54', glow: '#ff8f4f' },
  { altitude: 0.06, top: '#34579f', middle: '#b98aa6', bottom: '#ffa263', glow: '#ffb06a' },
  { altitude: 0.18, top: '#3a68b0', middle: '#8cb0d8', bottom: '#ffd3a2', glow: '#ffd68c' },
  { altitude: 0.4, top: '#3a84d6', middle: '#77b3ea', bottom: '#bfe0f6', glow: '#fff0c4' },
  { altitude: 1, top: '#2874de', middle: '#58a4ef', bottom: '#a8d5fa', glow: '#fff7dc' },
]

function paletteAt(altitude: number): Omit<Keyframe, 'altitude'> {
  const first = PALETTE[0]!
  const last = PALETTE[PALETTE.length - 1]!
  if (altitude <= first.altitude) return first
  if (altitude >= last.altitude) return last
  for (let i = 1; i < PALETTE.length; i++) {
    const upper = PALETTE[i]!
    const lower = PALETTE[i - 1]!
    if (altitude <= upper.altitude) {
      const t = (altitude - lower.altitude) / (upper.altitude - lower.altitude)
      return {
        top: mix(lower.top, upper.top, t),
        middle: mix(lower.middle, upper.middle, t),
        bottom: mix(lower.bottom, upper.bottom, t),
        glow: mix(lower.glow, upper.glow, t),
      }
    }
  }
  return last
}

// ---------- weather -> sky ----------

interface CategoryLook {
  /** Cloud cover to assume when the provider gives none. */
  defaultCloud: number
  /** How grey and dim the sky gets, 0–1. */
  gloom: number
  fog: number
}

const LOOK: Record<ConditionCategory, CategoryLook> = {
  clear: { defaultCloud: 0.05, gloom: 0, fog: 0 },
  'partly-cloudy': { defaultCloud: 0.45, gloom: 0.12, fog: 0 },
  overcast: { defaultCloud: 1, gloom: 0.55, fog: 0 },
  fog: { defaultCloud: 0.7, gloom: 0.5, fog: 0.85 },
  rain: { defaultCloud: 0.95, gloom: 0.7, fog: 0.15 },
  snow: { defaultCloud: 0.9, gloom: 0.45, fog: 0.25 },
  thunderstorm: { defaultCloud: 1, gloom: 0.88, fog: 0.1 },
  // Calm and neutral rather than a guess.
  unknown: { defaultCloud: 0.3, gloom: 0.1, fog: 0 },
}

/** Rain/snow strength from the WMO code: light 0.35, moderate 0.65, heavy 1. */
export function precipitationIntensity(condition: WeatherCondition | null): number {
  const code = condition?.code
  if (typeof code !== 'number') return 0.5
  if ([51, 56, 61, 66, 71, 77, 80, 85].includes(code)) return 0.35
  if ([53, 57, 63, 67, 73, 81, 95].includes(code)) return 0.65
  if ([55, 65, 75, 82, 86, 96, 99].includes(code)) return 1
  return 0.5
}

// ---------- sun and moon ----------

interface Arc {
  altitude: number
  sunX: number
  moonX: number
}

function localHour(timeMs: number, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date(timeMs))
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 12)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0)
  return hour + minute / 60
}

const toMs = (iso: string | null | undefined): number | null => {
  if (!iso) return null
  const ms = Date.parse(iso)
  return Number.isNaN(ms) ? null : ms
}

/**
 * Where the sun or moon is along its arc. Day: a half-sine from sunrise to sunset. Night: the
 * moon's arc from sunset to the next sunrise, falling off a little faster than a sine so twilight
 * darkens at a natural pace. Without usable sun times (polar day or night, or missing data) it
 * falls back to the provider's day/night flag, then to the local clock.
 */
function sunArc(input: SkyInput, timeMs: number): Arc {
  const sunrise = toMs(input.sunrise)
  const sunset = toMs(input.sunset)

  if (sunrise !== null && sunset !== null && sunset > sunrise) {
    if (timeMs >= sunrise && timeMs <= sunset) {
      const p = (timeMs - sunrise) / (sunset - sunrise)
      return { altitude: Math.sin(Math.PI * p), sunX: p, moonX: 0.5 }
    }
    const before = timeMs < sunrise
    const start = before ? (toMs(input.previousSunset) ?? sunset - DAY_MS) : sunset
    const end = before ? sunrise : (toMs(input.nextSunrise) ?? sunrise + DAY_MS)
    const q = clamp((timeMs - start) / (end - start))
    return { altitude: -Math.pow(Math.sin(Math.PI * q), 0.7), sunX: q < 0.5 ? 0 : 1, moonX: q }
  }

  if (input.isDay === true) return { altitude: 0.8, sunX: 0.5, moonX: 0.5 }
  if (input.isDay === false) return { altitude: -0.8, sunX: 0.5, moonX: 0.5 }

  const hour = localHour(timeMs, input.timezone)
  if (hour >= 6 && hour < 18) {
    const p = (hour - 6) / 12
    return { altitude: Math.sin(Math.PI * p), sunX: p, moonX: 0.5 }
  }
  const q = ((hour < 6 ? hour + 24 : hour) - 18) / 12
  return { altitude: -Math.pow(Math.sin(Math.PI * q), 0.7), sunX: 0.5, moonX: q }
}

// ---------- main ----------

export function computeSkyState(input: SkyInput): SkyState {
  const timeMs = Date.parse(input.time)
  const category: ConditionCategory = input.condition?.category ?? 'unknown'
  const look = LOOK[category]

  const { altitude, sunX, moonX } = sunArc(input, Number.isNaN(timeMs) ? Date.now() : timeMs)

  const cloudAmount =
    typeof input.cloudCover === 'number' ? clamp(input.cloudCover / 100) : look.defaultCloud
  const gloom = Math.max(look.gloom, cloudAmount * 0.6)

  const base = paletteAt(altitude)
  // Weather dims and greys the sky; at night the sky is already dark so it matters less.
  const dayness = smoothstep(-0.25, 0.25, altitude)
  const greyAmount = gloom * 0.8
  const dim = gloom * 0.3 * dayness
  const tone = (color: string) => darken(desaturate(color, greyAmount), dim)

  // Clouds are white by day, warm near the horizon at dawn and dusk, dim blue-grey at night.
  const warmth = 1 - smoothstep(0.05, 0.3, Math.abs(altitude))
  let cloud = mix('#27304e', '#ffffff', dayness)
  cloud = mix(cloud, base.glow, warmth * 0.55 * (1 - gloom))
  cloud = desaturate(cloud, gloom * 0.6)
  const cloudShade = mix(cloud, '#1b2238', 0.45 + gloom * 0.3)

  // Heavy cloud hides the sun and moon completely rather than leaving a grey disc behind.
  const bodyCover = 1 - smoothstep(0.2, 0.55, gloom)
  const night = 1 - dayness
  const colors: SkyColors = {
    top: tone(base.top),
    middle: tone(base.middle),
    bottom: tone(base.bottom),
    glow: tone(base.glow),
    sunCore: mix('#ffa24d', '#fffdf0', smoothstep(0, 0.4, altitude)),
    cloud: darken(cloud, gloom * 0.25 * dayness),
    cloudShade,
    hillFar: mix(tone(base.bottom), '#0a1020', 0.55 + night * 0.3),
    hillNear: mix(tone(base.bottom), '#05080f', 0.75 + night * 0.2),
  }

  const isRainy = category === 'rain' || category === 'thunderstorm'
  const precipKind = isRainy ? 'rain' : category === 'snow' ? 'snow' : 'none'

  const wind = typeof input.windSpeed === 'number' ? clamp(input.windSpeed / 60) : 0.25

  return {
    altitude,
    sun: {
      x: sunX,
      y: Math.max(altitude, 0),
      visible: smoothstep(-0.04, 0.03, altitude) * bodyCover,
    },
    moon: {
      x: moonX,
      y: Math.max(-altitude, 0),
      visible: smoothstep(-0.02, -0.12, altitude) * bodyCover,
    },
    colors,
    stars: smoothstep(-0.08, -0.4, altitude) * (1 - clamp(cloudAmount * 1.1)) * (1 - gloom),
    cloudAmount,
    precipitation: {
      kind: precipKind,
      intensity: precipKind === 'none' ? 0 : precipitationIntensity(input.condition),
    },
    fog: look.fog,
    lightning: category === 'thunderstorm',
    windDrift: lerp(0.15, 1, wind),
    condition: category,
  }
}
