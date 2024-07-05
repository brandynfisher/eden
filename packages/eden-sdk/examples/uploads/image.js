import eden from '../../init_eden.js'
import fs from 'fs'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filepath = `${__dirname}/images/test.jpeg`
const media = await fs.readFileSync(filepath)
const result = await eden.media.upload({ media })

console.log(result)