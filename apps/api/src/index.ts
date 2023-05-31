import createServer from './server'

process.on('unhandledRejection', err => {
  console.error(err)
  console.log('hi')
  process.exit(1)
})

const main = async () => {
  const server = await createServer()
  const port = +server.config.API_PORT
  const host = server.config.API_HOST
  await server.listen({ host, port })

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () =>
      server.close().then(err => {
        console.log(`close application on ${signal}`)
        process.exit(err ? 1 : 0)
      }),
    )
  }
}

main()
