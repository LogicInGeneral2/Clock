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
let contextMonitorInterval: NodeJS.Timeout | null = null
let heartbeatInterval: NodeJS.Timeout | null = null
let isAudioEnabled = false
let audioQueue: { path: string; priority: AudioPriority; volume: number }[] = []

// Enhanced audio context management
const ensureAudioContext = async (): Promise<boolean> => {
  try {
    const audioContext = Howler.ctx

    if (audioContext.state === "suspended") {
      console.log("Attempting to resume suspended AudioContext...")
      await audioContext.resume()

      if (audioContext.state === "suspended") {
        console.log(
          "AudioContext still suspended, attempting alternative approach...",
        )
        // Use a very short silent audio instead of 1-minute one
        const testHowl = new Howl({
          src: ["/audio/silent.mp3"],
          volume: 0,
          format: ["mp3"],
        })
        testHowl.play()
        setTimeout(() => {
          testHowl.stop()
          testHowl.unload()
        }, 100)

        await audioContext.resume()
      }
    }

    console.log("AudioContext state:", audioContext.state)
    return audioContext.state === "running"
  } catch (error) {
    console.error("Failed to ensure AudioContext:", error)
    return false
  }
}

// More aggressive audio context monitoring
export const monitorAudioContext = (): (() => void) => {
  if (contextMonitorInterval) {
    clearInterval(contextMonitorInterval)
  }

  contextMonitorInterval = setInterval(async () => {
    const audioContext = Howler.ctx
    console.log("AudioContext state check:", audioContext.state)

    if (audioContext.state !== "running") {
      const resumed = await ensureAudioContext()

      if (resumed && silentLoop && !silentLoop.playing()) {
        console.log("Restarting silent loop after context resume...")
        silentLoop.play()
      }
    }
  }, 30 * 1000)

  return () => {
    if (contextMonitorInterval) {
      clearInterval(contextMonitorInterval)
      contextMonitorInterval = null
    }
  }
}

// Improved audio heartbeat with shorter duration
const startAudioHeartbeat = (): void => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
  }

  heartbeatInterval = setInterval(async () => {
    if (!isAudioEnabled) return

    try {
      const audioContext = Howler.ctx

      // Create a very short, silent audio pulse (should be 1-3 seconds max)
      const heartbeat = new Howl({
        src: ["/audio/silent.mp3"],
        volume: 0,
        format: ["mp3"],
        onloaderror: () => {
          console.warn("Heartbeat audio failed to load")
        },
      })

      const playId = heartbeat.play()

      // Stop after 3 seconds maximum (adjust based on your silent.mp3 duration)
      setTimeout(() => {
        heartbeat.stop(playId)
        heartbeat.unload()
      }, 3000)

      console.log("Audio heartbeat sent, context state:", audioContext.state)
    } catch (error) {
      console.error("Audio heartbeat failed:", error)
    }
  }, 5 * 60 * 1000)
}

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
    silentLoop.stop()
    silentLoop.unload()
  }

  // Use a shorter silent audio file (1-3 seconds recommended)
  silentLoop = new Howl({
    src: ["/audio/silent.mp3"],
    loop: true,
    volume: 0,
    format: ["mp3"],
    onloaderror: (id, error) => {
      console.error("Failed to load silent audio:", error)
      silentLoop = null
    },
    onplay: () => {
      console.log("Silent loop started successfully")
      isAudioEnabled = true
    },
    onstop: () => {
      console.log("Silent loop stopped")
    },
  })

  silentLoop.play()
  monitorAudioContext()
  startAudioHeartbeat()

  return silentLoop
}

// Process audio queue
const processAudioQueue = (): void => {
  if (audioQueue.length === 0) return

  const nextAudio = audioQueue.shift()
  if (nextAudio) {
    playAudioWithPriority(nextAudio.path, nextAudio.priority, nextAudio.volume)
  }
}

export const playAudioWithPriority = async (
  audioPath: string,
  priority: AudioPriority,
  volume: number = 1.0,
): Promise<void> => {
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

  const contextReady = await ensureAudioContext()
  if (!contextReady) {
    console.error("AudioContext not ready, cannot play audio")
    return
  }

  const newPriority = priorityOrder[priority]

  // IMPROVED: Only interrupt if new audio has HIGHER priority (lower number)
  if (
    currentHowl?.playing() &&
    currentPriority < newPriority && // Changed from <= to <
    currentHowl !== silentLoop
  ) {
    console.log(
      `Audio already playing with higher priority (${currentPriority} vs ${newPriority}), queueing...`,
    )
    // Queue the audio instead of discarding it
    audioQueue.push({ path: audioPath, priority, volume })
    return
  }

  // Stop current audio only if new one has higher priority
  if (currentHowl && currentHowl !== silentLoop) {
    console.log(`Stopping current audio for higher priority: ${priority}`)
    currentHowl.stop()
    currentHowl.off("end")
    currentHowl.off("playerror")
    currentHowl = null
  }

  if (!audioCache[audioPath]) {
    console.log(`Loading audio: ${audioPath}`)
    audioCache[audioPath] = new Howl({
      src: [audioPath],
      preload: true,
      format: ["mp3"],
      onloaderror: (id, error) => {
        console.error(`Failed to load audio (${audioPath}):`, error)
        processAudioQueue() // Try next in queue if this fails
      },
    })
  }

  currentHowl = audioCache[audioPath]
  currentHowl.volume(Math.max(0, Math.min(1, volume)))
  currentPriority = newPriority

  console.log(`Playing audio: ${audioPath} with priority: ${priority}`)

  const playId = currentHowl.play()

  // Clear any existing event listeners to prevent memory leaks
  currentHowl.off("playerror")
  currentHowl.off("end")

  currentHowl.once("playerror", (id, error) => {
    if (id === playId) {
      console.error(`Error playing audio (${audioPath}):`, error)
      currentHowl = null
      currentPriority = Infinity
      processAudioQueue() // Try next in queue
    }
  })

  currentHowl.once("end", () => {
    console.log(`Audio finished: ${audioPath}`)
    currentHowl = null
    currentPriority = Infinity
    processAudioQueue() // Play next in queue
  })
}

// Enhanced cleanup with proper interval clearing
export const cleanupAudio = (): void => {
  console.log("Cleaning up audio resources...")

  // Clear intervals
  if (contextMonitorInterval) {
    clearInterval(contextMonitorInterval)
    contextMonitorInterval = null
  }

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }

  // Clear audio queue
  audioQueue = []

  // Stop and unload all cached audio
  Object.keys(audioCache).forEach((key) => {
    audioCache[key].stop()
    audioCache[key].unload()
    delete audioCache[key]
  })

  // Stop silent loop
  if (silentLoop) {
    silentLoop.stop()
    silentLoop.unload()
    silentLoop = null
  }

  // Stop current audio
  if (currentHowl) {
    currentHowl.stop()
    currentHowl = null
  }

  currentPriority = Infinity
  isAudioEnabled = false

  // Final cleanup
  Howler.unload()
}

// Add visibility change handler
export const handleVisibilityChange = async (): Promise<void> => {
  if (!document.hidden && isAudioEnabled) {
    console.log("Tab became visible, ensuring audio context...")
    const contextReady = await ensureAudioContext()

    if (contextReady && silentLoop && !silentLoop.playing()) {
      console.log("Restarting silent loop after visibility change...")
      silentLoop.play()
    }
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", handleVisibilityChange)
}
