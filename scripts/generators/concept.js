const params = [
  {
    name: 'name',
    label: 'Concept name',
    description:
      'Choose a name to save the Concept. This also sets how you can refer to the concept in prompts.',
    default: null,
    isRequired: true,
  },
  {
    name: 'lora_training_urls',
    label: 'Training images',
    description:
      'URLs for the image files of target concept to train a Concept for',
    mediaUpload: true,
    default: [],
    minLength: 1,
    maxLength: 8,
    isRequired: true,
  },
  {
    name: 'checkpoint',
    label: 'Base checkpoint',
    description: 'Base checkpoint to train from',
    default: 'sdxl-v1.0',
    allowedValues: ['sdxl-v1.0'],
  },
  {
    name: 'instance_prompt',
    label: 'Instance prompt',
    description:
      'A single prompt that describes the concept to be learned',
    default: null,
    isRequired: true,
  },
  {
    name: 'resolution',
    label: 'Resolution',
    description:
      'Image resolution (higher res needs lower batch size to avoid OOM!)',
    default: 960,
    minimum: 512,
    maximum: 1024,
    optional: true,
  },
  {
    name: 'lr_flip_p',
    label: 'Left-right flip probability',
    description:
      'Left-right flipping probability for data augmentation',
    default: 0.5,
    minimum: 0,
    maximum: 1,
    optional: true,
  },
  {
    name: 'train_batch_size',
    label: 'Batch size',
    description: 'Training batch size',
    default: 2,
    minimum: 1,
    maximum: 5,
    optional: true,
  },
  {
    name: 'gradient_accumulation_steps',
    label: 'Gradient accumulation steps',
    description: 'Gradient accumulation steps',
    default: 2,
    minimum: 1,
    maximum: 4,
    optional: true,
  },
  {
    name: 'learning_rate',
    label: 'U-Net learning rate',
    description: 'Learning rate for U-Net',
    default: 3e-4,
    minimum: 1e-5,
    maximum: 1e-3,
    step: 1e-6,
    optional: true,
  },
  {
    name: 'max_train_steps',
    label: 'Tuning max steps',
    description: 'Max train steps for tuning (U-Net and text encoder)',
    default: 400,
    minimum: 50,
    maximum: 1000,
    optional: true,
  },
  {
    name: 'lora_rank',
    label: 'LORA rank',
    description: 'Rank of LoRa matrices',
    default: 4,
    minimum: 1,
    maximum: 16,
    optional: true,
  },

]

export default params;