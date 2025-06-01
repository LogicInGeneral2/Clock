"use client"

import { useState, useEffect, useRef } from "react"
import { keepAudioContextAlive } from "@/services/audio"

export default function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAudioInitialized, setIsAudioInitialized] = useState(false)
  const fullscreenCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const userActivityTimeout = useRef<NodeJS.Timeout | null>(null)
  const lastActivityTime = useRef<number>(Date.now())

  // Check localStorage on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      const audioInit = localStorage.getItem("audioInitialized") === "true"
      setIsAudioInitialized(audioInit)

      if (audioInit) {
        console.log("Audio was previously initialized, restarting...")
        keepAudioContextAlive()
      }
    }
  }, [])

  // Track user activity to maintain fullscreen
  const trackActivity = () => {
    lastActivityTime.current = Date.now()

    // Reset the user activity timeout
    if (userActivityTimeout.current) {
      clearTimeout(userActivityTimeout.current)
    }

    // Set a new timeout for 30 minutes of inactivity
    userActivityTimeout.current = setTimeout(() => {
      console.log("User inactive for 30 minutes, maintaining fullscreen...")
      // Create a subtle activity to prevent automatic fullscreen exit
      simulateActivity()
    }, 30 * 60 * 1000) // 30 minutes
  }

  // Simulate minimal user activity to prevent fullscreen timeout
  const simulateActivity = () => {
    if (isFullscreen && document.fullscreenElement) {
      // Create a subtle mouse movement or key event simulation
      // This is a workaround for browser policies
      const event = new MouseEvent("mousemove", {
        clientX: 1,
        clientY: 1,
        bubbles: true,
      })
      document.dispatchEvent(event)

      // Schedule next activity simulation
      setTimeout(simulateActivity, 25 * 60 * 1000) // Every 25 minutes
    }
  }

  // Enhanced fullscreen monitoring
  useEffect(() => {
    if (isFullscreen) {
      // Check fullscreen status every 30 seconds
      fullscreenCheckInterval.current = setInterval(() => {
        const isActuallyFullscreen = !!document.fullscreenElement

        if (!isActuallyFullscreen && isFullscreen) {
          console.log(
            "Fullscreen was exited externally, attempting to re-enter...",
          )

          // Try to re-enter fullscreen automatically
          document.documentElement.requestFullscreen().catch((error) => {
            console.log("Could not re-enter fullscreen automatically:", error)
            // Update state if we can't re-enter
            setIsFullscreen(false)
            document.documentElement.classList.remove("cursor-none")
          })
        }
      }, 30000) // Check every 30 seconds

      // Start activity tracking
      trackActivity()

      // Add activity listeners
      const activityEvents = [
        "mousedown",
        "mousemove",
        "keypress",
        "scroll",
        "touchstart",
      ]
      activityEvents.forEach((event) => {
        document.addEventListener(event, trackActivity, { passive: true })
      })

      return () => {
        if (fullscreenCheckInterval.current) {
          clearInterval(fullscreenCheckInterval.current)
        }

        if (userActivityTimeout.current) {
          clearTimeout(userActivityTimeout.current)
        }

        // Remove activity listeners
        activityEvents.forEach((event) => {
          document.removeEventListener(event, trackActivity)
        })
      }
    }
  }, [isFullscreen])

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
        document.documentElement.classList.add("cursor-none")
        console.log("Entered fullscreen mode")
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
        document.documentElement.classList.remove("cursor-none")
        console.log("Exited fullscreen mode")
      }

      // Audio initialization on first interaction
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

        // Clear intervals when exiting fullscreen
        if (fullscreenCheckInterval.current) {
          clearInterval(fullscreenCheckInterval.current)
          fullscreenCheckInterval.current = null
        }

        if (userActivityTimeout.current) {
          clearTimeout(userActivityTimeout.current)
          userActivityTimeout.current = null
        }
      }
    }

    const handleFullscreenError = (event: Event) => {
      console.error("Fullscreen error:", event)
      setIsFullscreen(false)
      document.documentElement.classList.remove("cursor-none")
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("fullscreenerror", handleFullscreenError)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("fullscreenerror", handleFullscreenError)
      document.documentElement.classList.remove("cursor-none")

      if (fullscreenCheckInterval.current) {
        clearInterval(fullscreenCheckInterval.current)
      }

      if (userActivityTimeout.current) {
        clearTimeout(userActivityTimeout.current)
      }
    }
  }, [])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()

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
          ? "Exit fullscreen (Auto-maintained)"
          : "Enter fullscreen"
      }
    >
      {!isAudioInitialized && (
        <div
          className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"
          title="Audio not initialized - click to enable"
        />
      )}
      {isFullscreen && (
        <div
          className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
          title="Fullscreen is being maintained"
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
