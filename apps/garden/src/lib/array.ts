export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunkedArray: T[][] = []

  for (let i = 0; i < arr.length; i += size) {
    const chunk = arr.slice(i, i + size)
    chunkedArray.push(chunk)
  }

  return chunkedArray
}

// inside-out shuffle algo
export function shuffle<T>(arr: T[]) {
  for (let i = 0; i < arr.length; i++) {
    // Generate a random index from i to the last index
    const j = i + Math.floor(Math.random() * (arr.length - i))
    // Swap elements at indexes i and j
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
  return arr
}
