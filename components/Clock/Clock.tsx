"use client"

import moment from "moment"
import { useEffect, useState } from "react"
import { playAudioWithPriority } from "@/services/audio"

export default function Clock({ darkMode = false }: { darkMode?: boolean }) {
  const format = "h:mm:ss A"
  const [time, setTime] = useState(moment().format(format))

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = moment()
      setTime(currentTime.format(format))

      // Check for hourly audio (5 AM to 11 PM)
      const hour = currentTime.hour()
      const isOnTheHour =
        currentTime.minute() === 0 && currentTime.second() === 0
      if (isOnTheHour && hour >= 5 && hour <= 23) {
        const randomAudio = Math.floor(Math.random() * 8) + 1 // Random number 1-8
        playAudioWithPriority(`/audio/${randomAudio}.mp3`, "hourly")
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className={`${
        !darkMode ? "bg-white" : ""
      } p-7 text-center md:text-left md:w-100 rounded-md`}
    >
      <time className="text-5xl md:text-[7rem] font-bold">
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
