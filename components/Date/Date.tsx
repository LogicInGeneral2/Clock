"use client"

import moment from "moment-hijri"

export default function Date() {
  const dayName = moment().format("dddd,")
  const englishDate = moment().format("D MMMM YYYY")
  const hijriDate = moment().locale("en").format("iD iMMMM iYYYY")

  return (
    <div className="text-white text-center md:text-left">
      <p className="mt-7 font-bold text-5xl md:text-7xl">
        {dayName} {englishDate}
      </p>
      <p className="mt-5 md:mt-5 text-5xl md:text-7xl">{hijriDate}</p>
    </div>
  )
}
