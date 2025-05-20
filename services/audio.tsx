export type AudioPriority = "prayer" | "prePrayer" | "postPrayer" | "hourly"

const priorityOrder: Record<AudioPriority, number> = {
  prayer: 1,
  prePrayer: 2,
  postPrayer: 3,
  hourly: 4,
}

let currentAudio: HTMLAudioElement | null = null
let currentPriority: number = Infinity

export const playAudioWithPriority = (
  audioPath: string,
  priority: AudioPriority,
  volume: number = 1.0, // Default volume is 100%
) => {
  const newPriority = priorityOrder[priority]

  // If a higher or equal priority audio is playing, don't interrupt
  if (currentAudio && currentPriority <= newPriority) {
    return
  }

  // Stop current audio if any
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }

  // Play new audio
  const audio = new Audio(audioPath)
  audio.volume = Math.max(0, Math.min(1, volume)) // Ensure volume is between 0 and 1
  currentAudio = audio
  currentPriority = newPriority

  audio.play().catch((error) => {
    console.error("Error playing audio:", error)
  })

  // Reset when audio ends
  audio.onended = () => {
    currentAudio = null
    currentPriority = Infinity
  }
}
