export const getAspectRatio = (width: number, height: number) => {
  return height && width ? (height / width) * 100 : 100
}
