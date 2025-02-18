# Eden SDK

The official SDK for interacting with the Eden API. Supports both Node.js and browser environments.

## Installation

```bash
npm install @edenlabs/eden-sdk
# or
yarn add @edenlabs/eden-sdk
```

## Environment-Specific Configuration

### Node.js Environment

When using the SDK in a Node.js environment, no additional configuration is required. The SDK will automatically use the appropriate EventSource implementation.

### Browser Environment (Webpack 5+)

If you're using Webpack 5 or later in a browser environment, you'll need to add the following configuration to your `webpack.config.js`:

```javascript
module.exports = {
  // ... other config
  resolve: {
    fallback: {
      "url": false,
      "http": false,
      "https": false,
      "util": false
    }
  }
}
```

### Browser Environment (Using pre-built bundle)

For browser applications, you can use our pre-built UMD bundle which includes all necessary polyfills:

```html
<script src="https://unpkg.com/@edenlabs/eden-sdk@0.4.6/dist/index.umd.js"></script>
```

The UMD bundle is specifically built to work in browsers without any additional configuration. If you're experiencing issues with the ES module version in a browser environment, we recommend using this UMD bundle instead.

Or import it in your module bundler:

```javascript
import { EdenClient } from '@edenlabs/eden-sdk';
```

## Basic Usage

```javascript
import { EdenClient } from '@edenlabs/eden-sdk';

const client = new EdenClient({
  apiKey: 'your-api-key',
});

// Example: Create a task
const result = await client.tasks.createV2({
  tool: 'flux_dev',
  args: {
    prompt: 'Garden of Eden'
  }
});
```

## Environment Detection

The SDK automatically detects whether it's running in Node.js or a browser environment and uses the appropriate EventSource implementation. No manual configuration is required for this feature.

## Troubleshooting

### Webpack 5 Polyfill Issues

If you encounter errors related to missing Node.js core modules (url, http, https, util), make sure you've added the fallback configuration as shown in the "Browser Environment (Webpack 5+)" section above.

### SSE (Server-Sent Events) Connection Issues

- For Node.js: Make sure you have network access to the Eden API endpoint
- For Browsers: Ensure CORS is properly configured if you're running in a different domain

## License

MIT

A thin wrapper around the Eden REST API. Inspect methods.ts for all available methods.

### Creating an Eden instance

```js
import { EdenClient } from "@edenlabs/eden-sdk";

const apiKey = 'YOUR_API_KEY';

const eden = new EdenClient({ apiKey });
```

### Making a creation

Submit a task and await creation result

```js
const input = {
  tool: "flux_dev",
  args: {
    prompt: "Garden of Eden"
  }
}

const result = await eden.createV2(input);
```

Submit a task and return task data immediately, without waiting for creation result

```js
const input = {
  tool: "flux_dev",
  args: {
    prompt: "Garden of Eden"
  }
}

const result = await eden.createV2(input, false);
```

### Creations 

Get a single creation by id

```js
const creation = await eden.creations.getV2({creationId: '1234567890'})
```


### Tasks 

Get a single task by id

```js
const task = await eden.tasks.getV2({taskId: '1234567890'})
```

Get paginated list of tasks

```js
const tasks = await eden.tasks.listV2();
```

Get paginated list of tasks filterd by tool and status 

```js
const tasks = await eden.tasks.listV2({ tool: 'flux_dev', status: 'pending' });
```


### Tools 

To get a list of all the tools available:

```js
const tools = await eden.tools.list();
```

Get a single tool by key

```js
const tool = await eden.tools.get({key: 'flux_dev'});
```


### Uploading an image

```js
import fs from 'fs'

const filepath = `${__dirname}/test.png`
const media = await fs.readFileSync(filepath)

const result = await eden.media.upload({ media })
```


### Examples

See examples/ for more (*V2.js)