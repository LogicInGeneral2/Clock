import { Howl, Howler } from "howler"

export type AudioPriority = "prayer" | "prePrayer" | "postPrayer" | "hourly"

const priorityOrder: Record<AudioPriority, number> = {
  prayer: 1,
  prePrayer: 2,
  postPrayer: 3,
  hourly: 4,
}

let audioCache: Record<string, Howl> = {}
let currentHowl: Howl | null = null
let currentPriority: number = Infinity
let silentLoop: Howl | null = null

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

export const keepAudioContextAlive = (): Howl => {
  if (silentLoop) {
    return silentLoop
  }
  silentLoop = new Howl({
    src: ["/audio/silent.mp3"],
    loop: true,
    volume: 0,
    format: ["mp3"],
    onloaderror: (id, error) => {
      console.error("Failed to load silent audio:", error)
      silentLoop = null
    },
  })
  silentLoop.play()
  monitorAudioContext()
  return silentLoop
}

export const monitorAudioContext = (): (() => void) => {
  const checkInterval = setInterval(() => {
    const audioContext = Howler.ctx
    console.log("AudioContext state:", audioContext.state)
    if (audioContext.state === "suspended") {
      audioContext
        .resume()
        .then(() => {
          console.log("AudioContext resumed")
          if (silentLoop && !silentLoop.playing()) {
            silentLoop.play()
          }
        })
        .catch((error) => {
          console.error("Failed to resume AudioContext:", error)
        })
    }
  }, 60 * 1000)
  return () => clearInterval(checkInterval)
}

export const playAudioWithPriority = (
  audioPath: string,
  priority: AudioPriority,
  volume: number = 1.0,
): void => {
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

  if (
    currentHowl?.playing() &&
    currentPriority <= newPriority &&
    currentHowl !== silentLoop
  ) {
    return
  }

  if (currentHowl && currentHowl !== silentLoop) {
    currentHowl.stop()
    currentHowl.off("end")
    currentHowl = null
  }

  if (!audioCache[audioPath]) {
    audioCache[audioPath] = new Howl({
      src: [audioPath],
      preload: true,
      format: ["mp3"],
    })
  }

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
