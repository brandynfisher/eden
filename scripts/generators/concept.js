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
      'images to train on (can also be a .zip file)',
    mediaUpload: 'image/png, image/jpeg, image/webp, application/zip',
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
      'A single sentence that describes the concept to be learned (eg "a photo of a man" or "a cartoon of a superhero")',
    default: null,
    isRequired: true,
  },
  {
    name: 'resolution',
    label: 'Resolution',
    description:
      'Image resolution',
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
    default: 0.2,
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
    maximum: 3,
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
    label: 'learning rate',
    description: 'Learning rate for the trainer (recommended to keep this at default unless you know what youre doing) ',
    default: 3e-5,
    minimum: 1e-5,
    maximum: 2e-4,
    step: 1e-5,
    optional: true,
  },
  {
    name: 'max_train_steps',
    label: 'Tuning max steps',
    description: 'Max train steps for tuning (U-Net and text encoder)',
    default: 300,
    minimum: 100,
    maximum: 500,
    optional: true,
  },
  {
    name: 'lora_rank',
    label: 'LORA rank',
    description: 'Rank of LoRa matrices',
    default: 5,
    minimum: 2,
    maximum: 16,
    optional: true,
  },

]

export default params;
