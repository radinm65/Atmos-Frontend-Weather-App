/** Small colour helpers for the sky palette. All colours are `#rrggbb` strings. */

export type Rgb = readonly [number, number, number]

export const clamp = (value: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, value))

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

/** 0 at/below `edge0`, 1 at/above `edge1`, smooth in between. Works for either edge order. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

export function hexToRgb(hex: string): Rgb {
  const value = hex.replace('#', '')
  const int = Number.parseInt(value, 16)
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}

export function rgbToHex([r, g, b]: Rgb): string {
  const part = (n: number) =>
    Math.round(clamp(n, 0, 255))
      .toString(16)
      .padStart(2, '0')
  return `#${part(r)}${part(g)}${part(b)}`
}

export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  return rgbToHex([lerp(ar, br, t), lerp(ag, bg, t), lerp(ab, bb, t)])
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Moves a colour toward grey of the same brightness. `amount` 0 = unchanged, 1 = fully grey. */
export function desaturate(hex: string, amount: number): string {
  const grey = Math.round(luminance(hex))
  return rgbToHex(hexToRgb(hex).map((channel) => lerp(channel, grey, amount)) as unknown as Rgb)
}

/** Moves a colour toward black. */
export function darken(hex: string, amount: number): string {
  return mix(hex, '#000000', amount)
}
