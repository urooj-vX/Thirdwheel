export interface PersonAvatarInput {
  name: string;
  relationship_label?: string;
  relationship_status?: string;
}

/**
 * Returns doodle image path and background style for a person based on their
 * relationship_label (taking priority) or relationship_status.
 * Defaults to Open Doodles - Levitate.png for new people or unknown contexts.
 */
export function getAvatarForPerson(person: PersonAvatarInput): { doodleSrc: string; avatarBg: string } {
  const label = (
    person.relationship_label?.trim() ||
    (person.relationship_status
      ? person.relationship_status.charAt(0).toUpperCase() + person.relationship_status.slice(1)
      : '')
  ).toLowerCase();

  if (label.includes('talking') || label.includes('coffee')) {
    return { doodleSrc: '/illustrations/Open Doodles - Coffee.png', avatarBg: 'bg-[#FEF8E0]' };
  }
  if (label.includes('dating') || label.includes('hackathon') || label.includes('air')) {
    return { doodleSrc: '/illustrations/Open Doodles - In the Air.png', avatarBg: 'bg-[#FEF8E0]' };
  }
  if (label.includes('ex') || label.includes('breakup')) {
    return { doodleSrc: '/illustrations/ex-avatar.svg', avatarBg: 'bg-[#FFEDD5]' };
  }
  if (label.includes('paused') || label.includes('hold')) {
    return { doodleSrc: '/illustrations/ex-avatar.svg', avatarBg: 'bg-[#E7E5E4]' };
  }

  // Default fallback for any newly added person or unknown context (Open Doodles - Levitate.png)
  return { doodleSrc: '/illustrations/Open Doodles - Levitate.png', avatarBg: 'bg-[#FEF8E0]' };
}
