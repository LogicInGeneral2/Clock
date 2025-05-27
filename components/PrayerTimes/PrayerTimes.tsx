"use client"

import { useEffect, useState, useRef } from "react"
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

  const prayerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastTriggeredRef = useRef<Set<string>>(new Set())

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

  // Create unique key for prayer timing to prevent duplicate triggers
  const createTimingKey = (
    prayerLabel: string,
    type: string,
    time: moment.Moment,
  ): string => {
    return `${prayerLabel}-${type}-${time.format("YYYY-MM-DD-HH-mm-ss")}`
  }

  useEffect(() => {
    console.log("Setting up prayer time monitoring...")

    // Clear existing intervals
    if (prayerIntervalRef.current) clearInterval(prayerIntervalRef.current)
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current)

    // Reset triggered events for new day
    lastTriggeredRef.current.clear()

    prayerIntervalRef.current = setInterval(() => {
      setCurrentPrayerTime(getCurrentPrayer(today))
    }, 60 * 1000)

    audioIntervalRef.current = setInterval(() => {
      const currentTime = moment()
      const isFriday = currentTime.day() === 5

      PrayerTimesArray.forEach((prayer, index) => {
        try {
          const prayerTime = inferMomentTime(
            prayer.data.congregation_start,
            index,
          )

          // 20 minutes before prayer
          const prePrayerTime = prayerTime.clone().subtract(20, "minutes")
          const prePrayerKey = createTimingKey(
            prayer.label,
            "pre",
            prePrayerTime,
          )

          if (
            currentTime.isSame(prePrayerTime, "second") &&
            !lastTriggeredRef.current.has(prePrayerKey)
          ) {
            console.log(`Pre-prayer audio triggered for ${prayer.label}`)
            lastTriggeredRef.current.add(prePrayerKey)
            playAudioWithPriority(
              `/audio/${prayer.label.toLowerCase()}.mp3`,
              "prePrayer",
            ).catch((error) => {
              console.error(
                `Failed to play pre-prayer audio for ${prayer.label}:`,
                error,
              )
            })
          }

          // At prayer time
          const prayerKey = createTimingKey(prayer.label, "main", prayerTime)

          if (
            currentTime.isSame(prayerTime, "second") &&
            !lastTriggeredRef.current.has(prayerKey)
          ) {
            console.log(`Prayer audio triggered for ${prayer.label}`)
            lastTriggeredRef.current.add(prayerKey)
            const audioPath =
              prayer.label === "Fajr"
                ? "/audio/prayer_fajr.mp3"
                : "/audio/prayer.mp3"
            playAudioWithPriority(audioPath, "prayer").catch((error) => {
              console.error(
                `Failed to play prayer audio for ${prayer.label}:`,
                error,
              )
            })
          }

          // 60 minutes after prayer (for Isha only)
          if (prayer.label === "Isha") {
            const postPrayerTime = prayerTime.clone().add(60, "minutes")
            const postPrayerKey = createTimingKey(
              prayer.label,
              "post",
              postPrayerTime,
            )

            if (
              currentTime.isSame(postPrayerTime, "second") &&
              !lastTriggeredRef.current.has(postPrayerKey)
            ) {
              console.log(
                `Post-prayer audio triggered for ${prayer.label} (${
                  isFriday ? "Friday" : "Everyday"
                })`,
              )
              lastTriggeredRef.current.add(postPrayerKey)
              const audioPath = isFriday
                ? "/audio/friday.mp3"
                : "/audio/everyday.mp3"
              playAudioWithPriority(audioPath, "postPrayer").catch((error) => {
                console.error(
                  `Failed to play post-prayer audio for ${prayer.label}:`,
                  error,
                )
              })
            }
          }
        } catch (error) {
          console.error(
            `Error processing prayer time for ${prayer.label}:`,
            error,
          )
        }
      })

      // Cleanup old triggered events (older than 2 minutes)
      const cutoffTime = currentTime.clone().subtract(2, "minutes")
      const keysToRemove = Array.from(lastTriggeredRef.current).filter(
        (key) => {
          const parts = key.split("-")
          if (parts.length >= 6) {
            const keyTime = moment(
              `${parts[2]}-${parts[3]}-${parts[4]} ${parts[5]}:${parts[6]}:${parts[7]}`,
              "YYYY-MM-DD HH:mm:ss",
            )
            return keyTime.isBefore(cutoffTime)
          }
          return false
        },
      )

      keysToRemove.forEach((key) => lastTriggeredRef.current.delete(key))
    }, 1000)

    return () => {
      console.log("Cleaning up prayer time monitoring...")
      if (prayerIntervalRef.current) {
        clearInterval(prayerIntervalRef.current)
        prayerIntervalRef.current = null
      }
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current)
        audioIntervalRef.current = null
      }
      cleanupAudio()
    }
  }, [today]) // Re-setup when today's prayer times change

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
