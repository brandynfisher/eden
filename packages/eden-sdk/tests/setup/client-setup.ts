import { beforeEach } from 'vitest'

import { createTestClient } from '../util'

beforeEach(async context => {
  const client = await createTestClient()
  context.client = client
})
