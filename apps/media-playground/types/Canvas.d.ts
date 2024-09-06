// canvas.d.ts
declare module 'canvas' {
  export function createCanvas(width: number, height: number): any
  export function registerFont(fontPath: string, options?: any): void
  // Add other exports as needed
}
