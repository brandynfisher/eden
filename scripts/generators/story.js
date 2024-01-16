const params = [
  {
    name: 'characterIds',
    label: 'Characters',
    description: 'Characters involved in the story',
    isRequired: true,
    default: [],
    minLength: 3,
  },
  {
    name: 'prompt',
    label: 'Prompt',
    description: 'A synopsis for the story',
    isRequired: true,
  },
  {
    name: 'num_clips',
    label: 'Number of clips',
    description: 'How many clips is the story made out of',
    default: 4,
    minimum: 1,
    maximum: 10,
    optional: true,
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