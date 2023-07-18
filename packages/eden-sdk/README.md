# Eden SDK

A thin wrapper around the Eden REST API. Inspect methods.ts for all available methods.

### Creating an Eden instance

```
import { EdenClient } from "@edenlabs/eden-sdk";

const apiKey = 'YOUR_API_KEY';
const apiSecret = 'YOUR_API_SECRET';

const eden = new EdenClient({apiKey, apiSecret});
```

### Making a creation

```
const config = {
  text_input: "Garden of Eden"
}

const input = {
  generatorName: "create",
  config
}

const result = await eden.tasks.create(input);
```

### Uploading an image

```
import fs from 'fs'

const filepath = `${__dirname}/test.png`
const media = await fs.readFileSync(filepath)
const result = await client.media.upload({ media })
```

### Generator info

To get all the generators available:

```
const generators = await eden.generators.list();
console.log(generators);
```
