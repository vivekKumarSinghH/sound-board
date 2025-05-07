"use client"

import { useEffect, useRef } from "react"

interface WaveformVisualizerProps {
  data: number[]
  color?: string
  height?: number
}

export function WaveformVisualizer({
  data,
  color = "rgb(147, 51, 234)", // Purple-600 by default
  height = 64,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set up drawing styles
    ctx.lineWidth = 2
    ctx.strokeStyle = color

    // Start drawing path
    ctx.beginPath()

    // Calculate width of each segment
    const width = canvas.width / (data.length - 1 || 1)

    // Draw the waveform
    data.forEach((value, index) => {
      // Normalize the value (0-255) to fit in our canvas height
      const y = canvas.height - (value / 255) * canvas.height

      if (index === 0) {
        ctx.moveTo(0, y)
      } else {
        ctx.lineTo(index * width, y)
      }
    })

    // Stroke the path
    ctx.stroke()
  }, [data, color])

  return <canvas ref={canvasRef} width={300} height={height} className="w-full h-full" />
}
