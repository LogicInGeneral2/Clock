import { Howl, Howler } from "howler"

export type AudioPriority = "prayer" | "prePrayer" | "postPrayer" | "hourly"

// Define priority order (lower number = higher priority)
const priorityOrder: Record<AudioPriority, number> = {
  prayer: 1,
  prePrayer: 2,
  postPrayer: 3,
  hourly: 4,
}

// Store preloaded Howl instances
let audioCache: Record<string, Howl> = {}
let currentHowl: Howl | null = null
let currentPriority: number = Infinity
let silentLoop: Howl | null = null // For silent loop

// Preload audio files
export const preloadAudioFiles = (audioPaths: string[]): void => {
  if (!Array.isArray(audioPaths)) {
    console.error("preloadAudioFiles: audioPaths must be an array")
    return
  }
  audioPaths.forEach((path) => {
    if (typeof path !== "string" || path.trim() === "") {
      console.warn(`preloadAudioFiles: Invalid audio path: ${path}`)
      return
    }
    if (!audioCache[path]) {
      audioCache[path] = new Howl({
        src: [path],
        preload: true,
        volume: 1.0,
        format: ["mp3"],
        onloaderror: (id, error) => {
          console.error(`Failed to preload audio (${path}):`, error)
          delete audioCache[path]
        },
      })
    }
  })
}

// Keep audio context alive with a silent loop
export const keepAudioContextAlive = (): Howl => {
  if (silentLoop) {
    return silentLoop // Return existing loop if already running
  }
  silentLoop = new Howl({
    src: ["/audio/silent.mp3"],
    loop: true,
    volume: 0, // Inaudible
    format: ["mp3"],
    onloaderror: (id, error) => {
      console.error("Failed to load silent audio:", error)
      silentLoop = null
    },
  })
  silentLoop.play()
  return silentLoop
}

// Play audio with priority
export const playAudioWithPriority = (
  audioPath: string,
  priority: AudioPriority,
  volume: number = 1.0,
): void => {
  // Validate inputs
  if (typeof audioPath !== "string" || audioPath.trim() === "") {
    console.error("playAudioWithPriority: Invalid audioPath")
    return
  }
  if (!priorityOrder[priority]) {
    console.error(`playAudioWithPriority: Invalid priority: ${priority}`)
    return
  }
  if (typeof volume !== "number" || isNaN(volume)) {
    console.error("playAudioWithPriority: Volume must be a number")
    return
  }

  const newPriority = priorityOrder[priority]

  // Skip if a higher or equal priority audio is playing (excluding silent loop)
  if (
    currentHowl?.playing() &&
    currentPriority <= newPriority &&
    currentHowl !== silentLoop
  ) {
    return
  }

  // Stop current audio (excluding silent loop)
  if (currentHowl && currentHowl !== silentLoop) {
    currentHowl.stop()
    currentHowl.off("end")
    currentHowl = null
  }

  // Ensure audio is preloaded or create new Howl
  if (!audioCache[audioPath]) {
    audioCache[audioPath] = new Howl({
      src: [audioPath],
      preload: true,
      format: ["mp3"],
    })
  }

  // Play new audio
  currentHowl = audioCache[audioPath]
  currentHowl.volume(Math.max(0, Math.min(1, volume)))
  currentPriority = newPriority

  const playId = currentHowl.play()
  currentHowl.once("playerror", (id, error) => {
    if (id === playId) {
      console.error(`Error playing audio (${audioPath}):`, error)
      currentHowl = null
      currentPriority = Infinity
    }
  })

  currentHowl.once("end", () => {
    currentHowl = null
    currentPriority = Infinity
  })
}

// Clean up all audio resources
export const cleanupAudio = (): void => {
  Object.keys(audioCache).forEach((key) => {
    audioCache[key].stop()
    audioCache[key].unload()
    delete audioCache[key]
  })
  if (silentLoop) {
    silentLoop.stop()
    silentLoop.unload()
    silentLoop = null
  }
  currentHowl?.stop()
  currentHowl = null
  currentPriority = Infinity
  Howler.unload()
}
