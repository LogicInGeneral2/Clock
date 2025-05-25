"use client"

import { useEffect, useState } from "react"
import { getCurrentPrayer, getNextPrayer } from "@/services/PrayerTimeService"
import { DailyPrayerTime } from "@/types/DailyPrayerTimeType"
import moment from "moment"
import {
  cleanupAudio,
  playAudioWithPriority,
  preloadAudioFiles,
} from "@/services/audio"

export default function PrayerTimes({
  today,
  tomorrow,
}: {
  today: DailyPrayerTime
  tomorrow: DailyPrayerTime
}) {
  const PrayerTimesArray = [
    {
      label: "Fajr",
      data: today.fajr,
      tomorrow: tomorrow.fajr,
    },
    {
      label: "Zuhr",
      data: today.zuhr,
      tomorrow: tomorrow.zuhr,
    },
    {
      label: "Asr",
      data: today.asr,
      tomorrow: tomorrow.asr,
    },
    {
      label: "Maghrib",
      data: today.maghrib,
      tomorrow: tomorrow.maghrib,
    },
    {
      label: "Isha",
      data: today.isha,
      tomorrow: tomorrow.isha,
    },
  ]

  const [currentPrayerTime, setCurrentPrayerTime] = useState(
    getCurrentPrayer(today),
  )

  // Helper function to infer moment time (from PrayerTimeService)
  const inferMomentTime = (
    time: string,
    prayerIndex: number,
  ): moment.Moment => {
    const parsedTime = moment(time, ["h:mm", "hh:mm"])
    if (prayerIndex === 0) {
      // Fajr: Assume AM
      return parsedTime.hour() >= 0 && parsedTime.hour() < 12
        ? parsedTime
        : parsedTime.subtract(12, "hours")
    } else {
      // Other prayers: Assume PM
      return parsedTime.hour() < 12 ? parsedTime.add(12, "hours") : parsedTime
    }
  }

  useEffect(() => {
    const prayerInterval = setInterval(() => {
      setCurrentPrayerTime(getCurrentPrayer(today))
    }, 60 * 1000)

    const audioInterval = setInterval(() => {
      const currentTime = moment()
      const isFriday = currentTime.day() === 5 // Fixed to Friday
      PrayerTimesArray.forEach((prayer, index) => {
        const prayerTime = inferMomentTime(
          prayer.data.congregation_start,
          index,
        )
        if (
          currentTime.isSame(
            prayerTime.clone().subtract(20, "minutes"),
            "second",
          )
        ) {
          playAudioWithPriority(
            `/audio/${prayer.label.toLowerCase()}.mp3`,
            "prePrayer",
          )
        }
        if (currentTime.isSame(prayerTime, "second")) {
          const audioPath =
            prayer.label === "Fajr"
              ? "/audio/prayer_fajr.mp3"
              : "/audio/prayer.mp3"
          playAudioWithPriority(audioPath, "prayer")
        }
        if (
          currentTime.isSame(prayerTime.clone().add(60, "minutes"), "second")
        ) {
          const audioPath =
            prayer.label === "Isha"
              ? isFriday
                ? "/audio/friday.mp3"
                : "/audio/everyday.mp3"
              : null
          if (audioPath) {
            playAudioWithPriority(audioPath, "postPrayer")
          }
        }
      })
    }, 1000)

    return () => {
      clearInterval(prayerInterval)
      clearInterval(audioInterval)
      cleanupAudio()
    }
  }, [today])

  return (
    <table className="text-white mx-auto table-auto border-collapse border-none w-full">
      <thead>
        <tr className="text-center [&>*]:p-2 md:[&>*]:p-8 md:[&>*]:border [&>*]:border-mosqueGreen-dark [&>th]:border-t-0 [&>th:last-of-type]:border-r-0">
          <th className="sr-only">Prayer time</th>
          <th className="sr-only">Waktu Solat</th>
        </tr>
      </thead>
      <tbody>
        {PrayerTimesArray.map((prayer, index) => (
          <tr
            key={prayer.label}
            className="
              text-center
              [&>*]:p-3
              md:[&>*]:p-6
              md:[&>*]:border md:[&>*]:border-b-0 [&>*]:border-mosqueGreen-dark
              md:[&>th]:w-20
              [&>th]:border-l-0
              [&>td:last-of-type]:border-r-0
              border border-mosqueGreen-dark border-l-0 border-r-0
              last-of-type:border-b-0"
          >
            <th className="text-left text-xl md:text-5xl md:text-right">
              {prayer.label}
            </th>
            <td className="font-bold text-xl md:text-6xl">
              <span
                className={
                  currentPrayerTime.prayerIndex === index
                    ? "underline decoration-mosqueGreen-highlight underline-offset-8"
                    : ""
                }
              >
                {moment(prayer.data.congregation_start, ["HH:mm"]).format(
                  "h:mm",
                )}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
