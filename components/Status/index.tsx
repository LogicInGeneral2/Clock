import { getCurrentPrayer, getNextPrayer } from "@/services/PrayerTimeService"
import { DailyPrayerTime } from "@/types/DailyPrayerTimeType"

interface PrayerStatusProps {
  today: DailyPrayerTime
  tomorrow?: DailyPrayerTime
}

export default function PrayerStatus({ today, tomorrow }: PrayerStatusProps) {
  const currentPrayer = getCurrentPrayer(today)
  const nextPrayer = getNextPrayer(today)
  const prayerNames = ["Fajr", "Zuhr", "Asr", "Maghrib", "Isha"]
  const prayerTimes = [
    today.fajr.congregation_start,
    today.zuhr.congregation_start,
    today.asr.congregation_start,
    today.maghrib.congregation_start,
    today.isha.congregation_start,
  ]

  // Current prayer time
  const currentPrayerTime =
    currentPrayer.prayerIndex >= 0
      ? prayerTimes[currentPrayer.prayerIndex]
      : "N/A"

  // Next prayer name and time
  const nextPrayerName = nextPrayer.today
    ? prayerNames[nextPrayer.prayerIndex]
    : "Fajr (Tomorrow)"
  const nextPrayerTime = nextPrayer.today
    ? prayerTimes[nextPrayer.prayerIndex]
    : tomorrow?.fajr.congregation_start || "N/A"

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full mt-7">
      {/* Current Prayer Time */}
      <div className="flex-1 bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-mosqueGreen">
          Current Prayer
        </h3>

        <p className="text-6xl font-bold text-mosqueGreen">
          {currentPrayer.prayerName}
        </p>
        <p className="text-5xl text-mosqueGreen mt-2">{currentPrayerTime}</p>
      </div>
      {/* Upcoming Prayer Time */}
      <div className="flex-1 p-4 rounded-lg shadow-md border-2 border-w">
        <h3 className="text-xl font-semibold text-white">Next Prayer</h3>
        <p className="text-6xl font-bold text-white">{nextPrayerName}</p>
        <p className="text-4xl text-white mt-2">{nextPrayerTime}</p>
      </div>
    </div>
  )
}
