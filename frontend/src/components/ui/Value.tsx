import { MISSING } from '../../lib/formatting'

/** Renders a formatted measurement; a missing one shows a dash with "not available" for screen readers. */
export function Value({ text }: { text: string }) {
  if (text !== MISSING) return <>{text}</>
  return (
    <>
      <span aria-hidden="true">{MISSING}</span>
      <span className="visually-hidden">not available</span>
    </>
  )
}
