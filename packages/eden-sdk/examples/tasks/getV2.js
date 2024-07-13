const eden = require('../../init_eden.js')

const taskId = '0b74fb4091aa9ec9fcb9039d6e9de30c5b1e97b9863225ad'

async function run() {
  try {
    const result = await eden.tasks.getV2({ taskId });
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(error)
  } finally {
    console.log('Done')
  }
}

run()