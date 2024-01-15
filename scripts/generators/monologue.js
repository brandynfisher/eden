const params = [
  {
    name: 'characterId',
    label: 'Character',
    description: 'Character giving monologue',
    isRequired: true,
  },
  {
    name: 'prompt',
    label: 'Prompt',
    description: 'Prompt to complete with GPT',
    isRequired: true,
  },
  {
    name: 'temperature',
    label: 'Temperature',
    description: 'Sampling temperature (lower = more coherent, higher = more diverse)',
    default: 0.9,
    minimum: 0.0,
    maximum: 1.0,
    step: 0.01,
    optional: true,
  }
]

export default params;