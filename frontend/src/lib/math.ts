export const clamp = (value: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, value))

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

/** Maps `value` from [inMin, inMax] to [0, 1], clamped. A zero-width range gives 0. */
export function fraction(value: number, inMin: number, inMax: number): number {
  return inMax === inMin ? 0 : clamp((value - inMin) / (inMax - inMin))
}
