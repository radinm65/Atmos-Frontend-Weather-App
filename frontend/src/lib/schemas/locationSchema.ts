import { z } from 'zod'
import type { Location } from '../../domain/location'

/** Runtime check for a `Location`, used for stored and recorded data we do not control. */
export const locationSchema: z.ZodType<Location> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  region: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().optional(),
})

export function isLocation(value: unknown): value is Location {
  return locationSchema.safeParse(value).success
}
