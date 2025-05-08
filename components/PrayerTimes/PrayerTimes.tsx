"use client"

import { useEffect, useState } from "react"
import { getCurrentPrayer, getNextPrayer } from "@/services/PrayerTimeService"
import { DailyPrayerTime } from "@/types/DailyPrayerTimeType"
import moment from "moment"
import { playAudio } from "@/services/audio"

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

  // Audio paths (adjust paths based on your public folder structure)
  const audioPaths = {
    prePrayer: "/audio/pre-prayer.mp3", // 15 minutes before
    prayer: "/audio/prayer.mp3", // At prayer time
    postPrayer: "/audio/post-prayer.mp3", // After prayer
  }

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
    // Update current prayer every minute
    const prayerInterval = setInterval(() => {
      setCurrentPrayerTime(getCurrentPrayer(today))
    }, 60 * 1000)

    // Check for audio triggers every second
    const audioInterval = setInterval(() => {
      const currentTime = moment()

      PrayerTimesArray.forEach((prayer, index) => {
        const prayerTime = inferMomentTime(
          prayer.data.congregation_start,
          index,
        )

        // 15 minutes before prayer
        const prePrayerTime = prayerTime.clone().subtract(15, "minutes")
        if (
          currentTime.isSame(prePrayerTime, "second") &&
          currentTime.isSame(prePrayerTime, "minute")
        ) {
          playAudio(audioPaths.prePrayer)
        }

        // At prayer time
        if (
          currentTime.isSame(prayerTime, "second") &&
          currentTime.isSame(prayerTime, "minute")
        ) {
          playAudio(audioPaths.prayer)
        }

        // After prayer (e.g., 5 minutes after, adjust as needed)
        const postPrayerTime = prayerTime.clone().add(5, "minutes")
        if (
          currentTime.isSame(postPrayerTime, "second") &&
          currentTime.isSame(postPrayerTime, "minute")
        ) {
          playAudio(audioPaths.postPrayer)
        }
      })
    }, 1000)

    return () => {
      clearInterval(prayerInterval)
      clearInterval(audioInterval)
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
              [&>*]:p-4
              md:[&>*]:p-8
              md:[&>*]:border md:[&>*]:border-b-0 [&>*]:border-mosqueGreen-dark
              md:[&>th]:w-20
              [&>th]:border-l-0
              [&>td:last-of-type]:border-r-0
              border border-mosqueGreen-dark border-l-0 border-r-0
              last-of-type:border-b-0"
          >
            <th className="text-left text-xl md:text-4xl md:text-right">
              {prayer.label}
            </th>
            <td className="font-bold text-xl md:text-4xl">
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
