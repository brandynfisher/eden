import { AWS_BUCKET_NAME, client, CLOUDINARY_CLOUD_NAME, db, DRY_RUN } from './mongo_connect.js'
import _ from 'lodash'

console.log('update_image_urls')
console.log('-----------------')
console.log('')

const TASK_COLLECTION_NAME = 'tasks'
const CONCEPTS_COLLECTION_NAME = 'concepts'
const CHARACTERS_COLLECTION_NAME = 'characters'
const USERS_COLLECTION_NAME = 'users'

const TASK_MEDIA_URL_FIELDS = [
  'config.interpolation_texts',
  'config.control_image',
  'config.input_video_path',
  'config.audio_file',
  'config.init_images', // this is an array of strings!
  'config.lora_training_urls', // this is an array of strings!
  'config.face_url',
  'config.speech_url',
  'config.init_image_data',
  'config.interpolation_init_images', // this is an array of strings
  'config.text_input',
  'config.mask_images', // this is an array of strings
  'config.style_images', // this is an array of strings
  'config.input_images', // this is an array of strings
  'config.init_image',
  'config.init_image2',
  'config.image',
  'config.input_image_path',
]
const USER_MEDIA_URL_FIELD = 'userImage'
const CONCEPT_MEDIA_URL_FIELD = 'training_images' // This is an array of strings!
const CHARACTER_MEDIA_URL_FIELD = 'image'

const AWS_URL = `https://${AWS_BUCKET_NAME}.s3.amazonaws.com`
const CLOUDINARY_USER_UPLOADS_URL_REGEX = `^https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/(.*)/upload/(.*)/user_uploads/`
const BATCH_SIZE = 2500 // Adjust this value as per your MongoDB server's capacity

const updateUserCollection = async () => {
  console.log('updating collection', USERS_COLLECTION_NAME)
  const collection = db.collection(USERS_COLLECTION_NAME)
  const query = { [USER_MEDIA_URL_FIELD]: { '$regex': CLOUDINARY_USER_UPLOADS_URL_REGEX, '$options': 'i' } }

  let skip = 0
  let processedDocuments = 0
  let modifiedCount = 0

  while (true) {
    const documents = await collection.find(query).skip(skip).limit(BATCH_SIZE).toArray()

    if (documents.length === 0) {
      break
    }

    const operations = documents.map(doc => {
      const newValue = doc[USER_MEDIA_URL_FIELD].replace(new RegExp(CLOUDINARY_USER_UPLOADS_URL_REGEX), `${AWS_URL}/`)
      console.log({ id: doc._id, oldValue: doc[USER_MEDIA_URL_FIELD], newValue: newValue })

      return {
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              [USER_MEDIA_URL_FIELD]: newValue
            }
          }
        }
      }
    })

    if (!DRY_RUN) {
      console.log('LIVE OP')
      const result = await collection.bulkWrite(operations)
      console.log(`Batch starting from document ${skip + 1} - Modified documents count: ${result.modifiedCount}`)
      modifiedCount += result.modifiedCount
    } else {
      console.log('DRY RUN!')
    }

    processedDocuments += documents.length
    console.log('Processed documents:', processedDocuments)
    skip += BATCH_SIZE
  }

  console.log('Total documents processed:', processedDocuments)
  // Uncomment the following line to see the modified document count after actual updates
  console.log('Total documents updated:', modifiedCount)
}

const updateCharacterCollection = async () => {
  console.log('updating collection', CHARACTERS_COLLECTION_NAME)
  const collection = db.collection(CHARACTERS_COLLECTION_NAME)
  const query = { [CHARACTER_MEDIA_URL_FIELD]: { '$regex': CLOUDINARY_USER_UPLOADS_URL_REGEX, '$options': 'i' } }

  let skip = 0
  let processedDocuments = 0
  let modifiedCount = 0

  while (true) {
    const documents = await collection.find(query).skip(skip).limit(BATCH_SIZE).toArray()

    if (documents.length === 0) {
      break
    }

    const operations = documents.map(doc => {
      const newValue = doc[CHARACTER_MEDIA_URL_FIELD].replace(new RegExp(CLOUDINARY_USER_UPLOADS_URL_REGEX), `${AWS_URL}/`)
      console.log({ id: doc._id, oldValue: doc[CHARACTER_MEDIA_URL_FIELD], newValue: newValue })

      return {
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              [CHARACTER_MEDIA_URL_FIELD]: newValue
            }
          }
        }
      }
    })

    if (!DRY_RUN) {
      console.log('LIVE OP')
      const result = await collection.bulkWrite(operations)
      console.log(`Batch starting from document ${skip + 1} - Modified documents count: ${result.modifiedCount}`)
      modifiedCount += result.modifiedCount
    } else {
      console.log('DRY RUN!')
    }

    processedDocuments += documents.length
    console.log('Processed documents:', processedDocuments)
    skip += BATCH_SIZE
  }

  console.log('Total documents processed:', processedDocuments)
  // Uncomment the following line to see the modified document count after actual updates
  console.log('Total documents updated:', modifiedCount)
}

const updateConceptCollection = async () => {
  console.log('updating collection', CONCEPTS_COLLECTION_NAME)
  const collection = db.collection(CONCEPTS_COLLECTION_NAME)
  const query = { [CONCEPT_MEDIA_URL_FIELD]: { $elemMatch: { '$regex': CLOUDINARY_USER_UPLOADS_URL_REGEX, '$options': 'i' } } }

  let skip = 0
  let processedDocuments = 0
  let modifiedCount = 0

  while (true) {
    const documents = await collection.find(query).skip(skip).limit(BATCH_SIZE).toArray()

    if (documents.length === 0) {
      break
    }

    const operations = documents.map(doc => {

      // Here we replace every string that matches CLOUDINARY_USER_UPLOADS_URL_REGEX in the array
      const newValue = doc[CONCEPT_MEDIA_URL_FIELD].map(url => url ? url.replace(new RegExp(CLOUDINARY_USER_UPLOADS_URL_REGEX), `${AWS_URL}/`) : url);
      console.log({ id: doc._id, oldValue: doc[CONCEPT_MEDIA_URL_FIELD], newValue: newValue })

      return {
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              [CONCEPT_MEDIA_URL_FIELD]: newValue
            }
          }
        }
      }
    })

    // Uncomment these lines when ready to perform actual updates
    if (!DRY_RUN) {
      console.log('LIVE OP')
      const result = await collection.bulkWrite(operations)
      console.log(`Batch starting from document ${skip + 1} - Modified documents count: ${result.modifiedCount}`)
      modifiedCount += result.modifiedCount
    } else {
      console.log('DRY RUN!')
    }

    processedDocuments += documents.length
    console.log('Processed documents:', processedDocuments)
    skip += BATCH_SIZE
  }

  console.log('Total documents processed:', processedDocuments)
  // Uncomment the following line to see the modified document count after actual updates
  console.log('Total documents updated:', modifiedCount)
}

const updateTaskCollection = async () => {
  console.log('updating collection', TASK_COLLECTION_NAME)
  const collection = db.collection(TASK_COLLECTION_NAME)

  let skip = 0
  let processedDocuments = 0
  let modifiedCount = 0

  while(true) {
    const documents = await collection.find({ createdAt: { $gt: new Date("2024-05-05T10:03:46.000Z") } }).skip(skip).limit(BATCH_SIZE).toArray()

    if (documents.length === 0) {
      break
    }

    const operations = documents.map(doc => {
      const updateFields = {}

      TASK_MEDIA_URL_FIELDS.forEach(fieldName => {
        let fieldValue = _.get(doc, fieldName, null);
        if (fieldValue) {
          if(Array.isArray(fieldValue)) {
            let urls = fieldValue.map(url => typeof url === 'string' ? url.replace(new RegExp(CLOUDINARY_USER_UPLOADS_URL_REGEX, 'i'), `${AWS_URL}/`) : url);
            if (!_.isEqual(urls, fieldValue)) {
              updateFields[fieldName] = urls
            }
          } else if(typeof fieldValue === 'string') {
            let newValue = fieldValue.replace(new RegExp(CLOUDINARY_USER_UPLOADS_URL_REGEX, 'i'), `${AWS_URL}/`);
            if (newValue !== fieldValue) {
              updateFields[fieldName] = newValue;
            }
          }
        }
      });

      if (_.isEmpty(updateFields)) {
        return null;
      }

      // console.log({ id: doc._id, old: doc.config, updateFields })

      return {
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: updateFields }
        }
      }
    }).filter(Boolean);

    if (!DRY_RUN && operations.length > 0) {
      console.log('LIVE OP')
      const result = await collection.bulkWrite(operations)
      console.log(`Batch starting from document ${skip + 1} - Modified documents count: ${result.modifiedCount}`)
      modifiedCount += result.modifiedCount
    } else {
      console.log('DRY RUN!')
    }

    processedDocuments += documents.length
    console.log('Processed documents:', processedDocuments)
    skip += BATCH_SIZE
  }

  console.log('Total documents processed:', processedDocuments)
  console.log('Total documents updated:', modifiedCount)
}

const updateImageUrls = async () => {
  // await updateUserCollection()
  // await updateCharacterCollection()
  // await updateConceptCollection()
  await updateTaskCollection()
}

async function run() {
  console.log('running...', db.namespace)
  console.log('')
  await updateImageUrls()
}

run().then(
  (result) => {
    console.log('Result:', result)
  },
  (errorReason) => {
    console.error('Error:', errorReason)
  }).finally(async () => {
  await client.close()
  console.log('')
  console.log('Done.')
})