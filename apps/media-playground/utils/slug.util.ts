import slugify from 'slugify'

export const generateFilename = (...args: (string | number | undefined)[]) => {
  return slugify(args.join('_') || '', {
    trim: true,
    locale: 'en',
    strict: true,
  })
}
