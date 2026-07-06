export interface AvatarOption {
  id: string;
  emoji: string;
  name: string;
}

export const AVATARS: AvatarOption[] = [
  { id: 'fox', emoji: '🦊', name: 'Smart Fox' },
  { id: 'owl', emoji: '🦉', name: 'Wise Owl' },
  { id: 'tiger', emoji: '🐯', name: 'Brave Tiger' },
  { id: 'elephant', emoji: '🐘', name: 'Kind Elephant' },
  { id: 'lion', emoji: '🦁', name: 'Royal Lion' },
  { id: 'panda', emoji: '🐼', name: 'Calm Panda' },
  { id: 'bear', emoji: '🐻', name: 'Cozy Bear' },
  { id: 'koala', emoji: '🐨', name: 'Gentle Koala' },
  { id: 'rabbit', emoji: '🐰', name: 'Quick Rabbit' },
  { id: 'frog', emoji: '🐸', name: 'Cheerful Frog' },
  { id: 'monkey', emoji: '🐵', name: 'Curious Monkey' },
  { id: 'unicorn', emoji: '🦄', name: 'Magical Unicorn' },
  { id: 'penguin', emoji: '🐧', name: 'Playful Penguin' },
  { id: 'giraffe', emoji: '🦒', name: 'Tall Giraffe' },
  { id: 'dolphin', emoji: '🐬', name: 'Friendly Dolphin' },
  { id: 'squirrel', emoji: '🐿️', name: 'Active Squirrel' },
  { id: 'octopus', emoji: '🐙', name: 'Smart Octopus' },
  { id: 'bee', emoji: '🐝', name: 'Busy Bee' },
  { id: 'dinosaur', emoji: '🦖', name: 'Dino Companion' },
  { id: 'deer', emoji: '🦌', name: 'Swift Deer' },
];

export function getDeterministicAvatar(name: string, mobile: string): string {
  const input = (name || 'Student').trim() + (mobile || '1234567890').trim();
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATARS.length;
  return AVATARS[index].emoji;
}
