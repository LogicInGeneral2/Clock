"use client"

import moment from "moment"
import { useEffect, useState, useRef } from "react"
import {
  cleanupAudio,
  playAudioWithPriority,
  preloadAudioFiles,
  keepAudioContextAlive,
  handleVisibilityChange,
} from "@/services/audio"

export default function Clock({ darkMode = false }: { darkMode?: boolean }) {
  const format = "h:mm:ss A"
  const [time, setTime] = useState(moment().format(format))
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastHourRef = useRef<number>(-1)

  useEffect(() => {
    // Enhanced initialization
    const initializeAudio = () => {
      console.log("Initializing enhanced audio system...")
      keepAudioContextAlive()
    }

    // Initialize on first load
    initializeAudio()

    intervalRef.current = setInterval(() => {
      const currentTime = moment()
      setTime(currentTime.format(format))

      const hour = currentTime.hour()
      const minute = currentTime.minute()
      const second = currentTime.second()

      // Enhanced hourly chime logic
      const isOnTheHour = minute === 0 && second === 0

      if (
        isOnTheHour &&
        hour >= 5 &&
        hour <= 23 &&
        lastHourRef.current !== hour
      ) {
        console.log(`Hourly chime triggered at ${hour}:00`)
        lastHourRef.current = hour

        const randomAudio = Math.floor(Math.random() * 8) + 1
        playAudioWithPriority(`/audio/${randomAudio}.mp3`, "hourly", 0.5).catch(
          (error) => {
            console.error("Failed to play hourly chime:", error)
          },
        )
      }

      // Reset hour tracking at start of new hour
      if (minute === 1 && second === 0) {
        lastHourRef.current = -1
      }
    }, 1000)

    // Enhanced cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      cleanupAudio()
    }
  }, [])

  // Add focus/blur handlers for better audio management
  useEffect(() => {
    const handleFocus = () => {
      console.log("Window gained focus")
      handleVisibilityChange()
    }

    const handleBlur = () => {
      console.log("Window lost focus")
    }

    window.addEventListener("focus", handleFocus)
    window.addEventListener("blur", handleBlur)

    return () => {
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("blur", handleBlur)
    }
  }, [])

  return (
    <div
      className={`${
        !darkMode ? "bg-white" : ""
      } p-7 text-center md:text-left md:w-100 rounded-md`}
    >
      <time className="text-5xl md:text-[5rem] font-bold">
        {time.split("").map((char, i) => (
          <span
            key={i}
            className={`inline-block w-[1ch] text-center ${
              !darkMode ? "text-mosqueGreen" : "text-gray-500"
            }`}
          >
            {char}
          </span>
        ))}
      </time>
    </div>
  )
}
