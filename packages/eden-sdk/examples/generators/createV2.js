const eden = require('../../init_eden.js')

const args = {
  prompt: "Garden of Eden V2"
}

const input = {
  workflow: "txt2img",
  args
}

async function createTask() {
  try {
    const result = await eden.createV2(input);
    console.log(result);
  } catch (error) {
    console.error(error);
  } finally {
    console.log('finally');
  }
}

createTask();