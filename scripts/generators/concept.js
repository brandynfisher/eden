const params = [
  {
    name: 'name',
    label: 'Concept name',
    description:
      'Choose a name to save the Concept. (When prompting, just use <concept> to refer to your learned concept)',
    default: null,
    isRequired: true,
  },
  {
    name: 'lora_training_urls',
    label: 'Training images',
    description:
      'images to train on (can also be a .zip file containing your images)',
    mediaUpload: 'image/png, image/jpeg, image/webp, application/zip',
    default: [],
    minLength: 1,
    maxLength: 8,
    isRequired: true,
  },
  {
    name: 'mode',
    label: 'Training mode',
    description: 'What are you trying to learn?',
    default: 'concept',
    allowedValues: ['concept', 'face', 'style'],
    isRequired: true,
  },


  ////////////////////////////////////////
  // optional generation args
  
  {
    name: 'max_train_steps',
    label: 'Number of training steps',
    description: 'More steps can lead to a better fit of your concept, but too much training will lose your ability to "prompt" the concept and often causes visual artifacts',
    default: 700,
    minimum: 200,
    maximum: 1200,
    optional: true,
  },
  {
    name: 'left_right_flip_augmentation',
    label: 'To randomly flip training imgs left/right',
    description: 'Always turn on, except for faces you can try turning this off',
    default: true,
    allowedValues: [false, true],
    optional: true,
  },
  {
    name: 'lora_lr',
    label: 'learning rate for the LORA matrices',
    description: 'learning rate for the LORA matrices. This is the most important setting of the entire process (recommended to keep at default unless you know what youre doing)',
    default: 1e-4,
    minimum: 1e-5,
    maximum: 3e-4,
    step: 1e-5,
    optional: true,
  },
  {
    name: 'ti_lr',
    label: 'learning rate for textual inversion',
    description: 'learning rate for textual inversion phase. (recommended to keep at default unless you know what youre doing)',
    default: 3e-4,
    minimum: 3e-5,
    maximum: 1e-3,
    step: 1e-5,
    optional: true,
  },
  {
    name: 'lora_rank',
    label: 'LORA rank',
    description: 'Rank of LoRa matrices. Dont change unless you know what youre doing.',
    default: 4,
    minimum: 1,
    maximum: 16,
    optional: true,
  },
  {
    name: 'caption_prefix',
    label: 'trigger text',
    description:
      'A short sentence that describes & triggers the concept to be learned (eg "man with mustache" or "cartoon of a yellow superhero"). When empty, chatgpt takes care of this (recommended)',
    default: "",
    optional: true,
  },
  {
    name: 'resolution',
    label: 'Resolution',
    description:
      'Image resolution used for training',
    default: 960,
    minimum: 512,
    maximum: 1024,
    optional: true,
  },
  {
    name: 'train_batch_size',
    label: 'Batch size',
    description: 'Training batch size (number of images to look at simultaneously during training). Highly recommended to keep at 2',
    default: 2,
    minimum: 1,
    maximum: 3,
    optional: true,
  },
  {
    name: 'checkpoint',
    label: 'SDXL checkpoint',
    description: 'Which base model to start from',
    default: 'sdxl-v1.0',
    allowedValues: ['sdxl-v1.0'],
    optional: true,
  },
  
]

export default params;
