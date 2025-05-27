"use client"

import { useState, useEffect } from "react"
import { keepAudioContextAlive } from "@/services/audio"

export default function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAudioInitialized, setIsAudioInitialized] = useState(false)

  // Check localStorage on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      const audioInit = localStorage.getItem("audioInitialized") === "true"
      setIsAudioInitialized(audioInit)

      // If audio was previously initialized, restart the audio system
      if (audioInit) {
        console.log("Audio was previously initialized, restarting...")
        keepAudioContextAlive()
      }
    }
  }, [])

  // Enhanced fullscreen and audio initialization
  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
        document.documentElement.classList.add("cursor-none")
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
        document.documentElement.classList.remove("cursor-none")
      }

      // Enhanced audio initialization on first interaction
      if (!isAudioInitialized) {
        console.log(
          "First user interaction detected, initializing audio system...",
        )

        try {
          keepAudioContextAlive()
          setIsAudioInitialized(true)

          if (typeof window !== "undefined") {
            localStorage.setItem("audioInitialized", "true")
          }

          console.log("Audio system initialized successfully")
        } catch (audioError) {
          console.error("Failed to initialize audio system:", audioError)
        }
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error)
    }
  }

  // Enhanced fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement
      setIsFullscreen(isNowFullscreen)

      if (isNowFullscreen) {
        document.documentElement.classList.add("cursor-none")
        console.log("Entered fullscreen mode")
      } else {
        document.documentElement.classList.remove("cursor-none")
        console.log("Exited fullscreen mode")
      }
    }

    const handleFullscreenError = (event: Event) => {
      console.error("Fullscreen error:", event)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("fullscreenerror", handleFullscreenError)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("fullscreenerror", handleFullscreenError)
      document.documentElement.classList.remove("cursor-none")
    }
  }, [])

  // Add click handler for any interaction to initialize audio
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()

    // Initialize audio on any click if not already initialized
    if (!isAudioInitialized) {
      console.log("User interaction detected, initializing audio...")
      try {
        keepAudioContextAlive()
        setIsAudioInitialized(true)

        if (typeof window !== "undefined") {
          localStorage.setItem("audioInitialized", "true")
        }
      } catch (error) {
        console.error("Failed to initialize audio on click:", error)
      }
    }

    toggleFullscreen()
  }

  return (
    <button
      onClick={handleClick}
      className="absolute top-4 right-4 p-2 bg-mosqueGreen text-white rounded-md hover:bg-mosqueGreen-dark transition-colors z-10"
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      title={
        !isAudioInitialized
          ? "Click to enable audio and toggle fullscreen"
          : isFullscreen
          ? "Exit fullscreen"
          : "Enter fullscreen"
      }
    >
      {!isAudioInitialized && (
        <div
          className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"
          title="Audio not initialized - click to enable"
        />
      )}
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
