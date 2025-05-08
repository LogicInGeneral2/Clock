// components/Clock/Clock.tsx
"use client"

import { playAudio } from "@/services/audio"
import moment from "moment"
import { useEffect, useState } from "react"

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
        playAudio("../../public/audio/hourly.mp3")
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [format])

  return (
    <div
      className={`${
        !darkMode ? "bg-white" : ""
      } p-7 text-center md:text-left md:w-100 rounded-md`}
    >
      <time className="text-5xl md:text-8xl font-bold">
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
