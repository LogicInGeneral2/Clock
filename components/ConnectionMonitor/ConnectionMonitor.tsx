"use client"

import { useEffect, useState, useRef } from "react"

export default function ConnectionMonitor() {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)
  const [showStatus, setShowStatus] = useState(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const connectionCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      console.log("Browser reports online")
      handleConnectionRestored()
    }

    const handleOffline = () => {
      console.log("Browser reports offline")
      handleConnectionLost()
    }

    const handleConnectionRestored = () => {
      setIsOnline(true)

      // Double-check with actual network request before refreshing
      if (wasOffline) {
        console.log("Verifying connection before refresh...")
        verifyConnectionAndRefresh()
      }
    }

    const handleConnectionLost = () => {
      setIsOnline(false)
      setWasOffline(true)
      setShowStatus(true)
      startConnectionPolling()
    }

    const verifyConnectionAndRefresh = async () => {
      try {
        // Try multiple endpoints to ensure connection is truly restored
        const promises = [
          fetch("/favicon.ico", {
            method: "HEAD",
            cache: "no-cache",
            signal: AbortSignal.timeout(5000),
          }),
          fetch("/", {
            method: "HEAD",
            cache: "no-cache",
            signal: AbortSignal.timeout(5000),
          }),
        ]

        await Promise.any(promises)

        console.log("Connection verified, refreshing page...")
        // Small delay to ensure connection is stable
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } catch (error) {
        console.log("Connection verification failed, continuing to poll...")
        // Continue polling if verification fails
        startConnectionPolling()
      }
    }

    const startConnectionPolling = () => {
      // Clear existing interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }

      // Poll more aggressively when offline
      pollIntervalRef.current = setInterval(async () => {
        if (!isOnline) {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 3000)

            await fetch("/favicon.ico", {
              method: "HEAD",
              cache: "no-cache",
              signal: controller.signal,
            })

            clearTimeout(timeoutId)

            console.log("Connection restored via polling")
            handleConnectionRestored()
          } catch (error) {
            // Still offline, continue polling
            console.log("Still offline...")
          }
        }
      }, 10000) // Check every 10 seconds when offline
    }

    // Service Worker message handling
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "CONNECTION_RESTORED") {
        console.log("Service worker reports connection restored")
        handleConnectionRestored()
      }
    }

    // Register service worker message listener
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener(
        "message",
        handleServiceWorkerMessage,
      )
    }

    // Add event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Also check connection when page becomes visible (Android TV focus handling)
    const handleVisibilityChange = () => {
      if (!document.hidden && wasOffline) {
        console.log("Page became visible while offline, checking connection...")
        verifyConnectionAndRefresh()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Check connection on focus (for Android TV remote navigation)
    const handleFocus = () => {
      if (wasOffline) {
        console.log("Window focused while offline, checking connection...")
        verifyConnectionAndRefresh()
      }
    }

    window.addEventListener("focus", handleFocus)

    // Initial connection check
    if (!navigator.onLine) {
      handleConnectionLost()
    }

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener(
          "message",
          handleServiceWorkerMessage,
        )
      }

      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }

      if (connectionCheckTimeoutRef.current) {
        clearTimeout(connectionCheckTimeoutRef.current)
      }
    }
  }, [isOnline, wasOffline])

  // Auto-hide status after connection is restored
  useEffect(() => {
    if (isOnline && showStatus) {
      const timer = setTimeout(() => {
        setShowStatus(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, showStatus])

  // Show connection status for Android TV
  if (showStatus) {
    return (
      <div
        className={`fixed top-0 left-0 right-0 ${
          isOnline ? "bg-green-600" : "bg-red-600"
        } text-white text-center py-4 z-50 transition-all duration-300`}
      >
        <div className="flex items-center justify-center space-x-2">
          {isOnline ? (
            <>
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-lg font-semibold">
                ✅ Connection Restored - Refreshing...
              </span>
            </>
          ) : (
            <>
              <svg
                className="w-6 h-6 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="text-lg font-semibold">
                📡 No Internet - Checking connection...
              </span>
            </>
          )}
        </div>
        <p className="text-sm mt-1 opacity-90">
          {isOnline
            ? "Page will refresh automatically"
            : "Will refresh automatically when connection is restored"}
        </p>
      </div>
    )
  }

  return null
}
