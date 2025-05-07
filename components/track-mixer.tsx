"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlayCircle, StopCircle, Volume2, VolumeX, Download, Headphones, Music, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export interface AudioLoop {
  id: string
  roomId: string
  userId: string
  userName: string
  name: string
  orderIndex: number
  audioUrl: string
  createdAt: string
}

interface TrackMixerProps {
  loops: AudioLoop[]
  onDeleteLoop?: (loopId: string) => void
}

export function TrackMixer({ loops, onDeleteLoop }: TrackMixerProps) {
  const [trackStates, setTrackStates] = useState<
    Record<
      string,
      {
        volume: number
        muted: boolean
        solo: boolean
        playing: boolean
        audioBuffer?: AudioBuffer
      }
    >
  >({})
  const [isPlaying, setIsPlaying] = useState(false)
  const [masterVolume, setMasterVolume] = useState(80)
  const [isExporting, setIsExporting] = useState(false)

  const audioContext = useRef<AudioContext | null>(null)
  const audioNodes = useRef<
    Record<
      string,
      {
        source?: AudioBufferSourceNode
        gain?: GainNode
      }
    >
  >({})
  const startTime = useRef<number>(0)
  const { toast } = useToast()

  // Initialize audio context and track states
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    // Initialize track states for all loops
    const initialStates: Record<string, any> = {}
    loops.forEach((loop) => {
      if (!trackStates[loop.id]) {
        initialStates[loop.id] = {
          volume: 80,
          muted: false,
          solo: false,
          playing: false,
          audioBuffer: undefined,
        }
      }
    })

    if (Object.keys(initialStates).length > 0) {
      setTrackStates((prev) => ({ ...prev, ...initialStates }))
    }

    return () => {
      // Clean up audio context when component unmounts
      if (audioContext.current) {
        stopAllTracks()
        audioContext.current.close()
      }
    }
  }, [loops])

  // Load audio files
  useEffect(() => {
    const loadAudioFiles = async () => {
      if (!audioContext.current) return

      for (const loop of loops) {
        if (!trackStates[loop.id]?.audioBuffer) {
          try {
            const response = await fetch(`/api/loops/${loop.id}/audio`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            })

            if (!response.ok) {
              throw new Error(`Failed to fetch audio for loop ${loop.id}`)
            }

            const arrayBuffer = await response.arrayBuffer()
            const audioBuffer = await audioContext.current.decodeAudioData(arrayBuffer)

            setTrackStates((prev) => ({
              ...prev,
              [loop.id]: {
                ...prev[loop.id],
                audioBuffer,
              },
            }))
          } catch (error) {
            console.error(`Error loading audio for loop ${loop.id}:`, error)
          }
        }
      }
    }

    loadAudioFiles()
  }, [loops, trackStates])

  const playTrack = (loopId: string) => {
    if (!audioContext.current || !trackStates[loopId]?.audioBuffer) return

    // Stop existing playback of this track
    if (audioNodes.current[loopId]?.source) {
      audioNodes.current[loopId].source?.stop()
    }

    // Create new audio source
    const source = audioContext.current.createBufferSource()
    source.buffer = trackStates[loopId].audioBuffer
    source.loop = true

    // Create gain node for volume control
    const gainNode = audioContext.current.createGain()
    gainNode.gain.value = (trackStates[loopId].volume / 100) * (masterVolume / 100)

    if (trackStates[loopId].muted) {
      gainNode.gain.value = 0
    }

    // Connect nodes
    source.connect(gainNode)
    gainNode.connect(audioContext.current.destination)

    // Start playback
    source.start(0)

    // Store references
    audioNodes.current[loopId] = {
      source,
      gain: gainNode,
    }

    // Update state
    setTrackStates((prev) => ({
      ...prev,
      [loopId]: {
        ...prev[loopId],
        playing: true,
      },
    }))
  }

  const stopTrack = (loopId: string) => {
    if (audioNodes.current[loopId]?.source) {
      audioNodes.current[loopId].source?.stop()
      delete audioNodes.current[loopId]

      setTrackStates((prev) => ({
        ...prev,
        [loopId]: {
          ...prev[loopId],
          playing: false,
        },
      }))
    }
  }

  const playAllTracks = () => {
    if (!audioContext.current) return

    // Resume audio context if it's suspended (browser autoplay policy)
    if (audioContext.current.state === "suspended") {
      audioContext.current.resume()
    }

    startTime.current = audioContext.current.currentTime

    // Check if any tracks are soloed
    const hasSoloedTracks = Object.values(trackStates).some((track) => track.solo)

    loops.forEach((loop) => {
      const track = trackStates[loop.id]
      if (!track?.audioBuffer) return

      // Skip muted tracks or non-soloed tracks when some tracks are soloed
      if (track.muted || (hasSoloedTracks && !track.solo)) return

      playTrack(loop.id)
    })

    setIsPlaying(true)
  }

  const stopAllTracks = () => {
    Object.keys(audioNodes.current).forEach((loopId) => {
      if (audioNodes.current[loopId]?.source) {
        audioNodes.current[loopId].source?.stop()
      }
    })

    audioNodes.current = {}

    // Update all tracks to not playing
    const updatedStates = { ...trackStates }
    Object.keys(updatedStates).forEach((id) => {
      updatedStates[id].playing = false
    })

    setTrackStates(updatedStates)
    setIsPlaying(false)
  }

  const handleVolumeChange = (loopId: string, value: number[]) => {
    const newVolume = value[0]

    setTrackStates((prev) => ({
      ...prev,
      [loopId]: {
        ...prev[loopId],
        volume: newVolume,
      },
    }))

    // Update gain if track is playing
    if (audioNodes.current[loopId]?.gain) {
      audioNodes.current[loopId].gain.gain.value = (newVolume / 100) * (masterVolume / 100)
    }
  }

  const handleMasterVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setMasterVolume(newVolume)

    // Update all playing tracks
    Object.keys(audioNodes.current).forEach((loopId) => {
      if (audioNodes.current[loopId]?.gain) {
        const trackVolume = trackStates[loopId].volume
        audioNodes.current[loopId].gain.gain.value = (trackVolume / 100) * (newVolume / 100)
      }
    })
  }

  const toggleMute = (loopId: string) => {
    const newMuted = !trackStates[loopId].muted

    setTrackStates((prev) => ({
      ...prev,
      [loopId]: {
        ...prev[loopId],
        muted: newMuted,
        // If unmuting, turn off solo on other tracks
        solo: newMuted ? false : prev[loopId].solo,
      },
    }))

    // Update gain if track is playing
    if (audioNodes.current[loopId]?.gain) {
      audioNodes.current[loopId].gain.gain.value = newMuted
        ? 0
        : (trackStates[loopId].volume / 100) * (masterVolume / 100)
    }
  }

  const toggleSolo = (loopId: string) => {
    const newSolo = !trackStates[loopId].solo

    // Update all tracks
    const updatedStates = { ...trackStates }

    // If enabling solo, disable solo on all other tracks
    if (newSolo) {
      Object.keys(updatedStates).forEach((id) => {
        if (id !== loopId) {
          updatedStates[id].solo = false
        }
      })
    }

    updatedStates[loopId].solo = newSolo
    updatedStates[loopId].muted = false // Unmute when soloing

    setTrackStates(updatedStates)

    // If we're currently playing, restart playback with new solo settings
    if (isPlaying) {
      stopAllTracks()
      setTimeout(() => playAllTracks(), 10)
    }
  }

  const exportMixdown = async () => {
    if (!audioContext.current) return

    setIsExporting(true)
    toast({
      title: "Preparing mixdown",
      description: "Creating your audio file...",
    })

    try {
      // Create offline audio context for rendering
      const hasSoloedTracks = Object.values(trackStates).some((track) => track.solo)
      const tracksToMix = loops.filter((loop) => {
        const track = trackStates[loop.id]
        return track?.audioBuffer && !track.muted && (!hasSoloedTracks || track.solo)
      })

      if (tracksToMix.length === 0) {
        throw new Error("No tracks selected for export")
      }

      // Find the longest track duration
      let maxDuration = 0
      tracksToMix.forEach((loop) => {
        const buffer = trackStates[loop.id].audioBuffer
        if (buffer && buffer.duration > maxDuration) {
          maxDuration = buffer.duration
        }
      })

      // Create offline context with the max duration
      const offlineCtx = new OfflineAudioContext(
        2, // stereo
        audioContext.current.sampleRate * maxDuration,
        audioContext.current.sampleRate,
      )

      // Add all tracks to the offline context
      tracksToMix.forEach((loop) => {
        const source = offlineCtx.createBufferSource()
        source.buffer = trackStates[loop.id].audioBuffer

        const gain = offlineCtx.createGain()
        gain.gain.value = (trackStates[loop.id].volume / 100) * (masterVolume / 100)

        source.connect(gain)
        gain.connect(offlineCtx.destination)

        source.start(0)
      })

      // Render the audio
      const renderedBuffer = await offlineCtx.startRendering()

      // Convert to WAV
      const wavBlob = await audioBufferToWav(renderedBuffer)

      // Create download link
      const url = URL.createObjectURL(wavBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `soundboard-mix-${new Date().toISOString().slice(0, 10)}.wav`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Mixdown complete",
        description: "Your audio file has been downloaded.",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to create mixdown",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Helper function to convert AudioBuffer to WAV
  const audioBufferToWav = (buffer: AudioBuffer): Promise<Blob> => {
    return new Promise((resolve) => {
      const numChannels = buffer.numberOfChannels
      const length = buffer.length * numChannels * 2
      const sampleRate = buffer.sampleRate

      // Create the WAV file
      const wav = new DataView(new ArrayBuffer(44 + length))

      // RIFF chunk descriptor
      writeString(wav, 0, "RIFF")
      wav.setUint32(4, 36 + length, true)
      writeString(wav, 8, "WAVE")

      // fmt sub-chunk
      writeString(wav, 12, "fmt ")
      wav.setUint32(16, 16, true) // subchunk size
      wav.setUint16(20, 1, true) // PCM format
      wav.setUint16(22, numChannels, true)
      wav.setUint32(24, sampleRate, true)
      wav.setUint32(28, sampleRate * numChannels * 2, true) // byte rate
      wav.setUint16(32, numChannels * 2, true) // block align
      wav.setUint16(34, 16, true) // bits per sample

      // data sub-chunk
      writeString(wav, 36, "data")
      wav.setUint32(40, length, true)

      // Write the PCM samples
      const channels = []
      for (let i = 0; i < numChannels; i++) {
        channels.push(buffer.getChannelData(i))
      }

      let offset = 44
      for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
          const sample = Math.max(-1, Math.min(1, channels[channel][i]))
          const value = sample < 0 ? sample * 0x8000 : sample * 0x7fff
          wav.setInt16(offset, value, true)
          offset += 2
        }
      }

      resolve(new Blob([wav], { type: "audio/wav" }))
    })
  }

  // Helper function to write strings to DataView
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-purple-600" />
            Track Mixer
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={isPlaying ? stopAllTracks : playAllTracks}
              className="border-purple-200 dark:border-purple-800"
            >
              {isPlaying ? (
                <>
                  <StopCircle className="mr-2 h-4 w-4" />
                  Stop All
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Play All
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportMixdown}
              disabled={isExporting || loops.length === 0}
              className="border-purple-200 dark:border-purple-800"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Mixdown
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loops.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Headphones className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Audio Loops Yet</h3>
            <p className="text-muted-foreground max-w-md">
              Record some loops to start mixing. You'll be able to adjust volume, mute, and solo each track.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="master-volume">Master Volume</Label>
                <span className="text-sm text-muted-foreground">{masterVolume}%</span>
              </div>
              <Slider
                id="master-volume"
                defaultValue={[80]}
                value={[masterVolume]}
                max={100}
                step={1}
                onValueChange={handleMasterVolumeChange}
                className="w-full"
              />
            </div>

            <div className="space-y-4">
              {loops.map((loop) => {
                const track = trackStates[loop.id] || { volume: 80, muted: false, solo: false, playing: false }

                return (
                  <div key={loop.id} className="flex flex-col border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => (track.playing ? stopTrack(loop.id) : playTrack(loop.id))}
                          disabled={!trackStates[loop.id]?.audioBuffer}
                        >
                          {track.playing ? (
                            <StopCircle className="h-5 w-5 text-purple-600" />
                          ) : (
                            <PlayCircle className="h-5 w-5" />
                          )}
                        </Button>
                        <div>
                          <div className="font-medium">{loop.name}</div>
                          <div className="text-xs text-muted-foreground">By {loop.userName}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 w-7 p-0 ${track.muted ? "text-red-500" : ""}`}
                            onClick={() => toggleMute(loop.id)}
                            disabled={!trackStates[loop.id]?.audioBuffer}
                          >
                            {track.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                          </Button>
                          <span className="text-xs">Mute</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={track.solo}
                            onCheckedChange={() => toggleSolo(loop.id)}
                            disabled={!trackStates[loop.id]?.audioBuffer}
                          />
                          <span className="text-xs">Solo</span>
                        </div>
                        {onDeleteLoop && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                            onClick={() => onDeleteLoop(loop.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <Slider
                        defaultValue={[80]}
                        value={[track.volume]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleVolumeChange(loop.id, value)}
                        className="flex-1"
                        disabled={!trackStates[loop.id]?.audioBuffer}
                      />
                      <span className="text-xs text-muted-foreground w-8 text-right">{track.volume}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
