export const playAudio = (audioPath: string) => {
  const audio = new Audio(audioPath)
  audio.play().catch((error) => {
    console.error("Error playing audio:", error)
  })
}
