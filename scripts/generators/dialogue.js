const params = [
  {
    name: 'characterIds',
    label: 'Characters',
    description: 'Characters involved in the conversation',
    isRequired: true,
    default: [],
    minLength: 2,
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