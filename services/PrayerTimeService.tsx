import { DailyPrayerTime } from "@/types/DailyPrayerTimeType"
import moment from "moment"

const blackoutPeriod = process.env.BLACKOUT_PERIOD ?? 13 // defaults to 13 minutes

// Helper function to infer AM/PM based on prayer type
function inferMomentTime(time: string, prayerIndex: number): moment.Moment {
  const parsedTime = moment(time, ["h:mm", "hh:mm"])
  // Assign AM/PM based on typical prayer times
  if (prayerIndex === 0) {
    // Fajr: Assume AM (early morning)
    return parsedTime.hour() >= 0 && parsedTime.hour() < 12
      ? parsedTime
      : parsedTime.subtract(12, "hours")
  } else {
    // Zuhr, Asr, Maghrib, Isha: Assume PM (midday to evening)
    return parsedTime.hour() < 12 ? parsedTime.add(12, "hours") : parsedTime
  }
}

export function isBlackout(prayerTimes: DailyPrayerTime) {
  const currentTime = moment()
  const congregationTimes = [
    prayerTimes.fajr.congregation_start,
    prayerTimes.zuhr.congregation_start,
    prayerTimes.asr.congregation_start,
    prayerTimes.maghrib.congregation_start,
    prayerTimes.isha.congregation_start,
  ]

  let setBlackoutMode = false

  congregationTimes.forEach((time, index) => {
    const prayerTime = inferMomentTime(time, index)
    if (
      currentTime.isSameOrAfter(prayerTime) &&
      currentTime.isSameOrBefore(
        prayerTime.clone().add(blackoutPeriod, "minutes"),
      )
    ) {
      setBlackoutMode = true
    }
  })

  return setBlackoutMode
}

export function getNextPrayer(today: DailyPrayerTime) {
  const currentTime = moment()

  const todaysTimes = [
    today.fajr.congregation_start,
    today.zuhr.congregation_start,
    today.asr.congregation_start,
    today.maghrib.congregation_start,
    today.isha.congregation_start,
  ]

  let nextPrayertime = {
    today: false,
    prayerIndex: 0,
  }

  todaysTimes.forEach((time, index) => {
    const prayerTime = inferMomentTime(time, index)
    if (currentTime.isBefore(prayerTime) && !nextPrayertime.today) {
      nextPrayertime = {
        today: true,
        prayerIndex: index,
      }
    }
  })

  return nextPrayertime
}

export function getCurrentPrayer(today: DailyPrayerTime) {
  const currentTime = moment()
  console.log(`Current time: ${currentTime.format("h:mm A")}`)

  const congregationTimes = [
    today.fajr.congregation_start,
    today.zuhr.congregation_start,
    today.asr.congregation_start,
    today.maghrib.congregation_start,
    today.isha.congregation_start,
  ]
  const prayerNames = ["Fajr", "Zuhr", "Asr", "Maghrib", "Isha"]

  let currentPrayer = {
    prayerIndex: -1,
    prayerName: "None",
  }

  // Track the most recent prayer
  let mostRecentPrayer = { prayerIndex: -1, prayerTime: moment(0) }

  congregationTimes.forEach((time, index) => {
    const prayerTime = inferMomentTime(time, index)
    console.log(
      `Prayer: ${prayerNames[index]}, Time: ${prayerTime.format("h:mm A")}`,
    )

    // Check if prayer time is before or at current time
    if (prayerTime.isSameOrBefore(currentTime)) {
      // Update if this prayer is more recent than the current most recent
      if (prayerTime.isAfter(mostRecentPrayer.prayerTime)) {
        mostRecentPrayer = { prayerIndex: index, prayerTime }
        currentPrayer = {
          prayerIndex: index,
          prayerName: prayerNames[index],
        }
      }
    }
  })

  console.log(
    `Current prayer: ${currentPrayer.prayerName} (Index: ${currentPrayer.prayerIndex})`,
  )
  return currentPrayer
}
