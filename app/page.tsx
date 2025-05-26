import Clock from "@/components/Clock/Clock"
import Date from "@/components/Date/Date"
import FullscreenButton from "@/components/Fullscreen"
import PrayerTimes from "@/components/PrayerTimes/PrayerTimes"
import ServiceWorker from "@/components/ServiceWorker/ServiceWorker"
import PrayerStatus from "@/components/Status"
import { preloadAudioFiles } from "@/services/audio"
import {
  getJummahTimes,
  getMetaData,
  getPrayerTimesForUpcomingDays,
  getPrayerTimesForToday,
  getPrayerTimesForTomorrow,
} from "@/services/MosqueDataService"
import type {
  DailyPrayerTime,
  UpcomingPrayerTimes,
} from "@/types/DailyPrayerTimeType"
import type { JummahTimes } from "@/types/JummahTimesType"
import type { MosqueMetadataType } from "@/types/MosqueDataType"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const mosqueMetadata: MosqueMetadataType = await getMetaData()
  return {
    title: `${mosqueMetadata.name} Prayer Times | MosqueScreen Project by MosqueOS`,
    description: `${mosqueMetadata.address} | ${mosqueMetadata.name} | MosqueScreen Project by MosqueOS`,
  }
}

export default async function Home() {
  const today: DailyPrayerTime = await getPrayerTimesForToday()
  const tomorrow: DailyPrayerTime = await getPrayerTimesForTomorrow()
  const jummahTimes: JummahTimes = await getJummahTimes()
  const mosqueMetadata: MosqueMetadataType = await getMetaData()
  const upcomingPrayerDays: UpcomingPrayerTimes[] =
    await getPrayerTimesForUpcomingDays()

  // Preload audio files, including silent.mp3
  preloadAudioFiles([
    "/audio/silent.mp3", // Add silent audio
    "/audio/1.mp3",
    "/audio/2.mp3",
    "/audio/3.mp3",
    "/audio/4.mp3",
    "/audio/5.mp3",
    "/audio/6.mp3",
    "/audio/7.mp3",
    "/audio/8.mp3",
    "/audio/prayer.mp3",
    "/audio/prayer_fajr.mp3",
    "/audio/friday.mp3",
    "/audio/everyday.mp3",
    "/audio/fajr.mp3",
    "/audio/zuhr.mp3",
    "/audio/asr.mp3",
    "/audio/maghrib.mp3",
    "/audio/isha.mp3",
  ])

  return (
    <>
      <main className="md:p-5 relative">
        <FullscreenButton />
        <div className="md:grid md:grid-cols-8">
          <div className="md:col-span-5">
            <div className="p-4 md:p-6">
              <Clock />
            </div>
            <div className="p-4 md:p-6">
              <Date />
            </div>
            {/* Prayer Times 
            <div className="p-4 md:p-6">
              <PrayerStatus today={today} />
            </div>
            */}
          </div>
          <div className="p-4 md:p-6 md:col-span-3">
            <PrayerTimes today={today} tomorrow={tomorrow} />
          </div>
        </div>
        <ServiceWorker />
      </main>
    </>
  )
}
