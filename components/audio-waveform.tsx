"use client"

import { useEffect, useRef, useState } from "react"

interface AudioWaveformProps {
  audioUrl: string
  token: string
  color?: string
  height?: number
  playing?: boolean
}

export function AudioWaveform({
  audioUrl,
  token,
  color = "rgb(147, 51, 234)",
  height = 64,
  playing = false,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const animationRef = useRef<number>()
  const startTimeRef = useRef<number>(0)
  const durationRef = useRef<number>(0)

  // Load and process audio data
  useEffect(() => {
    const fetchAudio = async () => {
      try {
        setIsLoading(true)

        const response = await fetch(audioUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch audio")
        }

        const arrayBuffer = await response.arrayBuffer()

        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        durationRef.current = audioBuffer.duration

        // Get audio data from the first channel
        const channelData = audioBuffer.getChannelData(0)

        // Downsample the audio data to a reasonable number of points
        const points = 100
        const blockSize = Math.floor(channelData.length / points)
        const downsampled = []

        for (let i = 0; i < points; i++) {
          const blockStart = blockSize * i
          let sum = 0

          // Calculate the average amplitude in this block
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[blockStart + j])
          }

          // Normalize to 0-255 range for visualization
          downsampled.push((sum / blockSize) * 255 * 3)
        }

        setWaveformData(downsampled)
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading audio for waveform:", error)
        setIsLoading(false)
      }
    }

    fetchAudio()
  }, [audioUrl, token])

  // Handle playback progress animation
  useEffect(() => {
    if (playing && durationRef.current > 0) {
      startTimeRef.current = Date.now() - progress * durationRef.current * 1000

      const animate = () => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000
        const newProgress = Math.min(elapsed / durationRef.current, 1)
        setProgress(newProgress)

        if (newProgress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        }
      }

      animationRef.current = requestAnimationFrame(animate)
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    } else {
      if (!playing) {
        setProgress(0)
      }
    }
  }, [playing, progress])

  // Draw the waveform
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || waveformData.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate dimensions
    const width = canvas.width / waveformData.length
    const progressWidth = canvas.width * progress

    // Draw background waveform
    ctx.beginPath()
    ctx.lineWidth = 2
    ctx.strokeStyle = `${color}50` // Semi-transparent

    waveformData.forEach((value, index) => {
      const x = index * width
      const y = canvas.height - (value / 255) * canvas.height * 0.8

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Draw progress waveform
    if (progress > 0) {
      ctx.beginPath()
      ctx.lineWidth = 2
      ctx.strokeStyle = color

      waveformData.forEach((value, index) => {
        const x = index * width
        if (x <= progressWidth) {
          const y = canvas.height - (value / 255) * canvas.height * 0.8

          if (index === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
      })

      ctx.stroke()
    }
  }, [waveformData, color, progress])

  if (isLoading) {
    return (
      <div className="h-12 bg-purple-50 dark:bg-purple-900/10 rounded-md overflow-hidden animate-pulse">
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-xs text-muted-foreground">Loading waveform...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-12 bg-purple-50 dark:bg-purple-900/10 rounded-md overflow-hidden">
      <canvas ref={canvasRef} width={300} height={height} className="w-full h-full" />
    </div>
  )
}
