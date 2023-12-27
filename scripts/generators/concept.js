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
      'Images to train on. Highly recommended to use at least 3 diverse images! (can also be a .zip file with many images and optionally a prompt file per image (format: filename.jpg --> filename.txt))',
    mediaUpload: 'image/png, image/jpeg, image/webp, application/zip',
    default: [],
    minLength: 1,
    maxLength: 20,
    isRequired: true,
  },
  {
    name: 'concept_mode',
    label: 'Training mode',
    description: 'What are you trying to learn? Object is for any kind of object, character or thing and will try to ignore the background. Face tries to only learn the face (can be a person or character), style learns an entire aesthetic style consistent across many images.',
    default: 'style',
    allowedValues: ['object', 'face', 'style'],
    isRequired: true,
  },


  ////////////////////////////////////////
  // optional generation args
  
  {
    name: 'max_train_steps',
    label: 'Train steps',
    description: '600 is usually more than enough (often even too much for simple concepts), you can try to increase this for complex styles with many training images. Some faces also benefit from more training steps.',
    default: 600,
    minimum: 200,
    maximum: 1000,
  },
  {
    name: 'left_right_flip_augmentation',
    label: 'Random flip',
    description: 'Randomly flip training imgs left/right during training. (This will always be disabled automatically when training in face mode)',
    default: true,
    allowedValues: [false, true],
  },
  {
    name: 'lora_rank',
    label: 'LoRa rank',
    description: 'Rank of the LoRa matrices. (recommended to keep at default unless you know what youre doing)',
    default: 12,
    minimum: 4,
    maximum: 32,
    optional: true,
  },
  {
    name: 'resolution',
    label: 'Train resolution',
    description:
      'Image resolution used for training your concept into the model (recommended to keep at default)',
    default: 960,
    minimum: 640,
    maximum: 1024,
    optional: true,
  },
  
]

export default params;
