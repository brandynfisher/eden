import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Eden Create',
    short_name: 'Eden Create',
    description: 'The Garden of Artificial Delights',
    start_url: '/',
    display: 'fullscreen',
    background_color: '#030712',
    theme_color: '#030712',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
