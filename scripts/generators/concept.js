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
    name: 'concept_mode',
    label: 'Training mode',
    description: 'What are you trying to learn? Object generally refers to any kind of coherent object, character or thing. Face is specifically for learning a face (can be a person of character), style is to learn an aesthetic style thats consistent across diverse images.',
    default: 'object',
    allowedValues: ['object', 'face', 'style'],
    isRequired: true,
  },


  ////////////////////////////////////////
  // optional generation args
  
  {
    name: 'max_train_steps',
    label: 'Number of training steps',
    description: 'More steps can lead to a better fit of your concept, but too much training will lose your ability to "prompt" the concept and often causes visual artifacts',
    default: 1200,
    minimum: 600,
    maximum: 3000,
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
    name: 'prodigy_d_coef',
    label: 'Multiplier for internal learning rate of Prodigy optimizer',
    description: 'Multiplier for internal learning rate of Prodigy optimizer (recommended to keep at default unless you know what youre doing)',
    default: 0.5,
    minimum: 0.1,
    maximum: 1.0,
    step: 0.05,
    optional: true,
  },
  {
    name: 'ti_lr',
    label: 'learning rate for textual inversion',
    description: 'learning rate for textual inversion phase. (recommended to keep at default unless you know what youre doing)',
    default: 2e-3,
    minimum: 5e-4,
    maximum: 4e-3,
    step: 1e-4,
    optional: true,
  },
  {
    name: 'lora_rank',
    label: 'LORA rank',
    description: 'Rank of LoRa matrices. Dont change unless you know what youre doing.',
    default: 6,
    minimum: 4,
    maximum: 16,
    optional: true,
  },
  {
    name: 'resolution',
    label: 'Resolution',
    description:
      'Image resolution used for training',
    default: 1024,
    minimum: 640,
    maximum: 1024,
    optional: true,
  },
  
]

export default params;
