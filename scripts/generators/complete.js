export default [
  {
    name: 'prompt',
    label: 'Prompt',
    description: 'Prompt to complete with GPT-3',
    default: null,
    isRequired: true,
  },
  {
    name: 'max_tokens',
    label: 'Max tokens',
    description: 'Maximum number of tokens to generate with GPT-3',
    default: 150,
    minimum: 1,
    maximum: 2048,
    optional: true,
  },
  {
    name: 'temperature',
    label: 'Temperature',
    description: 'GPT-3 sampling temperature',
    default: 0.9,
    minimum: 0.0,
    maximum: 1.0,
    step: 0.01,
    optional: true,
  },
]

