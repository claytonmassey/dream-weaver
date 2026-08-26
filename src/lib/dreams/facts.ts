/** Shared dream factoids for processing / pending UI. */
export const DREAM_FACTS = [
  "Falling dreams are one of the most common dreams in the world.",
  "Dreams about teeth falling out often track stress or feeling powerless.",
  "Being chased in a dream usually mirrors something you’re avoiding awake.",
  "Flying dreams are linked to freedom, control, or a sudden lift in mood.",
  "Showing up unprepared (or naked) often echoes social anxiety.",
  "Most people forget about 95% of a dream within a few minutes of waking.",
  "You typically dream four to six times a night — most of it vanishes by morning.",
  "Dreaming happens in every sleep stage, not only REM.",
  "Recurring dreams often point to something unfinished in waking life.",
  "Familiar faces in dreams are often mental composites, not exact people.",
  "Keeping a dream journal can make recall sharper within a week.",
  "Nightmares can be the brain rehearsing threat in a safe setting.",
  "Smell and taste rarely appear in dreams; sight and emotion usually lead.",
  "Lucid dreamers catch the glitch — clocks, text, or light that won’t behave.",
  "Water in dreams often tracks emotion: calm seas vs. rising floods.",
  "Losing your way (halls, cities, doors) often maps feeling lost or stuck.",
  "Animals in dreams frequently stand in for instinct, fear, or protection.",
  "Colorful dreams are normal — true black-and-white dreams are less common.",
  "The average dream lasts only a few minutes, though it can feel much longer.",
  "People who wake during REM remember dreams more vividly.",
  "Babies spend far more time in REM sleep than adults — dreaming starts early.",
  "Some blind people still “see” in dreams; others dream in sound and touch.",
  "Stress the day before often shows up as more intense dream imagery.",
  "Your brain is almost as active in REM as when you’re awake.",
  "False awakenings — dreaming that you’ve woken up — are surprisingly common.",
  "Dreams can remix memories from the last day with older emotional threads.",
];

export function nextDreamFactIndex(current: number): number {
  if (DREAM_FACTS.length <= 1) return 0;
  let next = Math.floor(Math.random() * DREAM_FACTS.length);
  if (next === current) next = (current + 1) % DREAM_FACTS.length;
  return next;
}
