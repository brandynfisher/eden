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
      'images to train on (can also be a .zip file containing many images and optionally even a prompt per image (format: filename.jpg --> filename.txt))',
    mediaUpload: 'image/png, image/jpeg, image/webp, application/zip',
    default: [],
    minLength: 1,
    maxLength: 20,
    isRequired: true,
  },
  {
    name: 'concept_mode',
    label: 'Training mode',
    description: 'What are you trying to learn? Object generally refers to any kind of coherent object, character or thing. Face is specifically for learning a face (can be a person or a character), style is to learn an aesthetic style thats consistent across diverse images.',
    default: 'object',
    allowedValues: ['object', 'face', 'style'],
    isRequired: true,
  },


  ////////////////////////////////////////
  // optional generation args
  
  {
    name: 'max_train_steps',
    label: 'Number of training steps',
    description: '1000 is usually more than enough (even too much for simple concepts), you can try to increase for complex styles with many images',
    default: 1000,
    minimum: 200,
    maximum: 2000,
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
    label: 'Learning rate multiplier',
    description: 'Multiplier for internal learning rate of the optimizer (recommended to keep at default unless you know what youre doing)',
    default: 0.5,
    minimum: 0.1,
    maximum: 1.0,
    step: 0.05,
    optional: true,
  },
  {
    name: 'ti_lr',
    label: 'learning rate for textual inversion',
    description: 'learning rate for learning the new token. (recommended to keep at default unless you know what youre doing)',
    default: 2e-3,
    minimum: 5e-4,
    maximum: 4e-3,
    step: 1e-4,
    optional: true,
  },
  {
    name: 'lora_rank',
    label: 'LORA rank',
    description: 'Rank of the LoRa matrices. (recommended to keep at default unless you know what youre doing)',
    default: 12,
    minimum: 4,
    maximum: 32,
    optional: true,
  },
  {
    name: 'resolution',
    label: 'Resolution',
    description:
      'Image resolution used for training (recommended to keep at default)',
    default: 1024,
    minimum: 640,
    maximum: 1024,
    optional: true,
  },
  
]

export default params;
