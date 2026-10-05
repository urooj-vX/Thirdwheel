import { describe, it, expect } from 'vitest';
import React from 'react';
import { PersonCard } from '@/components/PersonCard';
import { PersonChatView } from '@/components/PersonChatView';
import { getAvatarForPerson } from '@/lib/avatars';

describe('Component & Avatar Render Test Suite', () => {
  const person1 = {
    person_id: 'person-1',
    name: 'Sam',
    relationship_label: 'Hackathon Buddy',
    relationship_status: 'talking',
    section: 'active' as const,
    factCount: 3,
    assumptionCount: 1,
    uncertaintyCount: 0,
    lastInteractionTimestamp: new Date().toISOString(),
  };

  const person2 = {
    person_id: 'person-2',
    name: 'Jordan',
    relationship_label: 'Archery Coach', // No explicit avatar keyword match -> fallback
    relationship_status: 'active',
    section: 'active' as const,
    factCount: 0,
    assumptionCount: 0,
    uncertaintyCount: 0,
    lastInteractionTimestamp: new Date().toISOString(),
  };

  const person3 = {
    person_id: 'person-3',
    name: 'Taylor',
    relationship_label: undefined,
    relationship_status: undefined,
    section: 'active' as const,
    factCount: 1,
    assumptionCount: 0,
    uncertaintyCount: 0,
    lastInteractionTimestamp: new Date().toISOString(),
  };

  it('1. getAvatarForPerson extracts correctly and prioritizes custom label over status', () => {
    // Person 1: Custom label takes priority
    const res1 = getAvatarForPerson(person1);
    expect(res1.doodleSrc).toContain('In the Air');

    // Person 2: No avatar match -> returns default fallback
    const res2 = getAvatarForPerson(person2);
    expect(res2.doodleSrc).toContain('Levitate');

    // Person 3: No label or status -> returns default fallback
    const res3 = getAvatarForPerson(person3);
    expect(res3.doodleSrc).toContain('Levitate');
  });

  it('2. PersonCard renders cleanly without throwing for all 3 people', () => {
    const renderCard1 = () =>
      React.createElement(PersonCard, {
        person: person1,
        isActive: false,
        onSelect: () => {},
      });

    const renderCard2 = () =>
      React.createElement(PersonCard, {
        person: person2,
        isActive: true,
        onSelect: () => {},
      });

    const renderCard3 = () =>
      React.createElement(PersonCard, {
        person: person3,
        isActive: false,
        onSelect: () => {},
      });

    expect(renderCard1).not.toThrow();
    expect(renderCard2).not.toThrow();
    expect(renderCard3).not.toThrow();
  });

  it('3. PersonChatView renders cleanly without throwing for all 3 people', () => {
    const renderChat1 = () =>
      React.createElement(PersonChatView, {
        person: person1,
        onBack: () => {},
      });

    const renderChat2 = () =>
      React.createElement(PersonChatView, {
        person: person2,
        onBack: () => {},
      });

    const renderChat3 = () =>
      React.createElement(PersonChatView, {
        person: person3,
        onBack: () => {},
      });

    expect(renderChat1).not.toThrow();
    expect(renderChat2).not.toThrow();
    expect(renderChat3).not.toThrow();
  });
});
