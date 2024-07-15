export const sanitize = (text: string) => {
  return text.replace(/[^a-z0-9_\-\s]/gi, '_')
}
