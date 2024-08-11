export type SiteConfig = {
  name: string
  author: string
  description: string
  keywords: Array<string>
  url: {
    base: string
    author: string
  }
  links: {
    homepage: string
    instagram: string
    twitter: string
    linkedIn: string
    github: string
  }
  ogImage: string
}
