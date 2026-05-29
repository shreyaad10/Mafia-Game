export const ROLES = {
  God: {
    icon: '👁️',
    color: '#f5c842',
    glow: 'rgba(245,200,66,0.6)',
    title: 'The All-Seeing God',
    description:
      'You control the game. You know every role. Guide the night, observe the chaos, and ensure justice is served. The fate of the village rests in your hands.',
    team: 'neutral',
    gradient: 'linear-gradient(135deg, #f5c842 0%, #e88c1a 100%)',
  },
  Doctor: {
    icon: '💉',
    color: '#42f5b9',
    glow: 'rgba(66,245,185,0.6)',
    title: 'The Doctor',
    description:
      'You hold the power of life. Each night, choose one soul to protect from the Mafia\'s deadly grasp. Your identity must remain secret — your death means no more saves.',
    team: 'village',
    gradient: 'linear-gradient(135deg, #42f5b9 0%, #1a9e72 100%)',
  },
  Mafia: {
    icon: '🔪',
    color: '#f54242',
    glow: 'rgba(245,66,66,0.6)',
    title: 'The Mafia',
    description:
      'You are the shadow in the night. Coordinate with your fellow Mafia members to eliminate threats. Blend in during the day. Strike when darkness falls.',
    team: 'mafia',
    gradient: 'linear-gradient(135deg, #f54242 0%, #8b0000 100%)',
  },
  Villager: {
    icon: '🏘️',
    color: '#a8c8f0',
    glow: 'rgba(168,200,240,0.6)',
    title: 'The Villager',
    description:
      'You are the heart of the village. Your only weapon is deduction and trust. Debate, observe, and vote wisely during the day to expose the Mafia lurking among you.',
    team: 'village',
    gradient: 'linear-gradient(135deg, #a8c8f0 0%, #4a7ab5 100%)',
  },
};
