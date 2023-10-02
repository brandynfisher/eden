export const getAspectRatio = (
  width: number | undefined,
  height: number | undefined,
) => {
  return height && width ? (height / width) * 100 : 100
}
