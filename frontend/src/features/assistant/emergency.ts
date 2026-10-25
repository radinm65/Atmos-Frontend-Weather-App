/**
 * A fixed safety notice, shown by the app itself (not written by the model) next to any question
 * that sounds like a weather emergency. A model's wording cannot be guaranteed, so this part is
 * deterministic. It over-triggers on purpose: a needless reminder costs nothing.
 */
const EMERGENCY =
  /\b(tornado|hurricane|cyclone|typhoon|tsunami|flash ?flood|flood(?:ing|ed)?|evacuat\w*|wildfire|blizzard|ice storm|lightning|thunderstorm warning|severe (?:weather|storm)|storm warning|weather warning|heat ?stroke|hypothermia|frostbite|trapped|emergency|in danger|take cover|shelter)\b/i

export function looksLikeEmergency(question: string): boolean {
  return EMERGENCY.test(question)
}

export const EMERGENCY_NOTICE =
  'If you or someone near you is in danger, call your local emergency number now. For severe weather, follow your national weather service and local authorities: this assistant is not an official warning source.'
