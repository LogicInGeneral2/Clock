"use client"

import { useState, useEffect } from "react"

export default function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Handle fullscreen toggle
  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
        // Add class to hide cursor
        document.documentElement.classList.add("cursor-none")
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
        // Remove class to show cursor
        document.documentElement.classList.remove("cursor-none")
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement
      setIsFullscreen(isNowFullscreen)
      // Update cursor visibility based on fullscreen state
      if (isNowFullscreen) {
        document.documentElement.classList.add("cursor-none")
      } else {
        document.documentElement.classList.remove("cursor-none")
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      // Ensure cursor is restored on component unmount
      document.documentElement.classList.remove("cursor-none")
    }
  }, [])

  return (
    <button
      onClick={toggleFullscreen}
      className="absolute top-4 right-4 p-2 bg-mosqueGreen text-white rounded-md hover:bg-mosqueGreen-dark transition-colors z-10"
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      {isFullscreen ? (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ) : (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5"
          />
        </svg>
      )}
    </button>
  )
}
