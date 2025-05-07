"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MusicIcon, Mic, StopCircle, PlayCircle, Copy, ArrowLeft, Loader2, Volume2, VolumeX, Trash2, Users, Info, User } from 'lucide-react'
import { useAuth } from "@/hooks/use-auth"
import { WaveformVisualizer } from "@/components/waveform-visualizer"
import { AudioWaveform } from "@/components/audio-waveform"
import { TrackMixer } from "@/components/track-mixer"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Types
interface JamRoom {
  id: string
  title: string
  bpm: number
  keySignature: string
  isPublic: boolean
  hostId: string
  code: string
  createdAt: string
  participants: string[]
}

interface AudioLoop {
  id: string
  roomId: string
  userId: string
  userName: string
  name: string
  orderIndex: number
  audioUrl: string
  createdAt: string
}

export default function JamRoomPage() {
  // Use the useParams hook to get the id parameter
  const params = useParams<{ id: string }>()
  const roomId = params.id

  const [room, setRoom] = useState<JamRoom | null>(null)
  const [loops, setLoops] = useState<AudioLoop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [newLoopName, setNewLoopName] = useState("")
  const [playingLoopId, setPlayingLoopId] = useState<string | null>(null)
  const [loopVolumes, setLoopVolumes] = useState<Record<string, number>>({})
  const [mutedLoops, setMutedLoops] = useState<Record<string, boolean>>({})
  const [recordingData, setRecordingData] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState<"loops" | "mixer">("loops")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [uniqueParticipants, setUniqueParticipants] = useState<Set<string>>(new Set())

  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading: isAuthLoading } = useAuth()

  // Refs for audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({})
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Format time in mm:ss format
  const formatTime = (timeInSeconds: number) => {
    if (!timeInSeconds || isNaN(timeInSeconds)) return "0:00"
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    if (isAuthLoading) return

    if (!user) {
      router.push("/login")
      return
    }

    fetchRoomData()

    // Set up polling for new loops
    const pollInterval = setInterval(() => {
      fetchLoops()
    }, 5000)

    return () => {
      clearInterval(pollInterval)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [roomId, user, isAuthLoading, router])

  // Update unique participants when loops change
  useEffect(() => {
    const participants = new Set<string>()

    // Add all loop creators
    loops.forEach((loop) => {
      participants.add(loop.userId)
    })

    // Add room host if available
    if (room?.hostId) {
      participants.add(room.hostId)
    }

    setUniqueParticipants(participants)
  }, [loops, room])

  const fetchRoomData = async () => {
    try {
      // Fetch room data
      const roomResponse = await fetch(`/api/rooms/${roomId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!roomResponse.ok) {
        throw new Error("Failed to fetch room data")
      }

      const roomData = await roomResponse.json()
      setRoom(roomData.room)

      // Fetch loops
      await fetchLoops()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load jam room data",
        variant: "destructive",
      })
      router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLoops = async () => {
    try {
      const loopsResponse = await fetch(`/api/rooms/${roomId}/loops`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!loopsResponse.ok) {
        throw new Error("Failed to fetch loops")
      }

      const loopsData = await loopsResponse.json()
      setLoops(loopsData.loops)

      // Initialize volumes for new loops
      const newVolumes = { ...loopVolumes }
      const newMuted = { ...mutedLoops }

      loopsData.loops.forEach((loop: AudioLoop) => {
        if (newVolumes[loop.id] === undefined) {
          newVolumes[loop.id] = 80
        }
        if (newMuted[loop.id] === undefined) {
          newMuted[loop.id] = false
        }
      })

      setLoopVolumes(newVolumes)
      setMutedLoops(newMuted)
    } catch (error) {
      console.error("Error fetching loops:", error)
    }
  }

  const startRecording = async () => {
    if (!user || !room) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      analyserRef.current = analyser
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      dataArrayRef.current = dataArray

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })

        // Create a FormData object to send the audio file
        const formData = new FormData()
        formData.append("audio", audioBlob, "recording.wav")
        formData.append("name", newLoopName || `Loop ${loops.length + 1}`)

        try {
          const response = await fetch(`/api/rooms/${room.id}/loops`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: formData,
          })

          if (!response.ok) {
            throw new Error("Failed to save recording")
          }

          const data = await response.json()

          toast({
            title: "Loop Recorded",
            description: `Your loop "${data.loop.name}" has been saved.`,
          })

          // Add the new loop to the list
          setLoops((prevLoops) => [...prevLoops, data.loop])

          // Initialize volume for the new loop
          setLoopVolumes((prev) => ({ ...prev, [data.loop.id]: 80 }))
          setMutedLoops((prev) => ({ ...prev, [data.loop.id]: false }))
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to save your recording",
            variant: "destructive",
          })
        }

        // Reset
        setNewLoopName("")
        setRecordingTime(0)
        setRecordingData([])

        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop())

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
      }

      // Start visualizing audio
      const visualize = () => {
        if (!analyserRef.current || !dataArrayRef.current) return

        analyserRef.current.getByteFrequencyData(dataArrayRef.current)

        // Calculate average level for visualization
        const average =
          Array.from(dataArrayRef.current)
            .slice(0, 40) // Use lower frequencies for better visualization
            .reduce((sum, value) => sum + value, 0) / 40

        setRecordingData((prev) => {
          const newData = [...prev, average]
          if (newData.length > 50) {
            return newData.slice(newData.length - 50)
          }
          return newData
        })

        animationFrameRef.current = requestAnimationFrame(visualize)
      }

      visualize()

      // Start recording
      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)

      // Set up timer for recording duration
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          // Auto-stop after 30 seconds
          if (prev >= 30) {
            stopRecording()
            return 0
          }
          return prev + 1
        })
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      toast({
        title: "Microphone Error",
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const playLoop = async (loopId: string) => {
    // Stop any currently playing audio
    if (playingLoopId && audioElementsRef.current[playingLoopId]) {
      audioElementsRef.current[playingLoopId].pause()
      audioElementsRef.current[playingLoopId].currentTime = 0
    }

    const loop = loops.find((l) => l.id === loopId)
    if (!loop) return

    try {
      // If we don't have the audio element yet, create it
      if (!audioElementsRef.current[loopId]) {
        // Fetch the audio file
        const response = await fetch(`/api/loops/${loopId}/audio`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch audio")
        }

        const blob = await response.blob()
        const audioUrl = URL.createObjectURL(blob)

        const audio = new Audio(audioUrl)
        audio.addEventListener("ended", () => {
          setPlayingLoopId(null)
        })

        audioElementsRef.current[loopId] = audio
      }

      // Set volume
      audioElementsRef.current[loopId].volume = mutedLoops[loopId] ? 0 : loopVolumes[loopId] / 100

      // Play the audio
      audioElementsRef.current[loopId].play()
      setPlayingLoopId(loopId)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to play audio loop",
        variant: "destructive",
      })
    }
  }

  const stopLoop = (loopId: string) => {
    if (audioElementsRef.current[loopId]) {
      audioElementsRef.current[loopId].pause()
      audioElementsRef.current[loopId].currentTime = 0
      setPlayingLoopId(null)
    }
  }

  const handleVolumeChange = (loopId: string, value: number[]) => {
    const newVolume = value[0]
    setLoopVolumes((prev) => ({ ...prev, [loopId]: newVolume }))

    // Update audio element volume if it exists and is playing
    if (audioElementsRef.current[loopId]) {
      audioElementsRef.current[loopId].volume = mutedLoops[loopId] ? 0 : newVolume / 100
    }
  }

  const toggleMute = (loopId: string) => {
    const newMuted = !mutedLoops[loopId]
    setMutedLoops((prev) => ({ ...prev, [loopId]: newMuted }))

    // Update audio element volume if it exists
    if (audioElementsRef.current[loopId]) {
      audioElementsRef.current[loopId].volume = newMuted ? 0 : loopVolumes[loopId] / 100
    }
  }

  const copyRoomCode = () => {
    if (!room) return

    navigator.clipboard.writeText(room.code)
    toast({
      title: "Room Code Copied",
      description: "Share this code with others to invite them to your jam session.",
    })
  }

  const deleteLoop = async (loopId: string) => {
    if (!confirm("Are you sure you want to delete this loop?")) return

    setIsDeleting(loopId)

    try {
      const response = await fetch(`/api/loops/${loopId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete loop")
      }

      // Remove the loop from the list
      setLoops((prevLoops) => prevLoops.filter((loop) => loop.id !== loopId))

      toast({
        title: "Loop Deleted",
        description: "The audio loop has been removed.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the loop",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  if (isLoading || isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <div className="text-center">Loading jam room...</div>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">Room not found</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-purple-50 dark:from-background dark:to-purple-900/5">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-1 text-sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-2 font-bold">
              <MusicIcon className="h-5 w-5 text-purple-600" />
              <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent font-extrabold">
                {room.title}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/20">
                      <Info className="h-3.5 w-3.5 text-purple-600" />
                      <span className="text-xs font-medium">{room.bpm} BPM</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Beats Per Minute - The tempo of this jam session</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/20">
                      <MusicIcon className="h-3.5 w-3.5 text-purple-600" />
                      <span className="text-xs font-medium">Key: {room.keySignature}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Musical key for this jam session</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Badge variant="outline" className="flex items-center gap-1 border-purple-200 dark:border-purple-800">
                <Users className="h-3 w-3 text-purple-600" />
                <span>
                  {uniqueParticipants.size} {uniqueParticipants.size === 1 ? "Jammer" : "Jammers"}
                </span>
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={copyRoomCode}
              className="border-purple-200 dark:border-purple-800"
            >
              <Copy className="mr-2 h-4 w-4" />
              Room Code: {room.code}
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-8">
        <Tabs
          defaultValue="loops"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "loops" | "mixer")}
          className="w-full"
        >
          <TabsList className="mb-6 mx-auto">
            <TabsTrigger value="loops">
              <Mic className="mr-2 h-4 w-4" />
              Record Loops
            </TabsTrigger>
            <TabsTrigger value="mixer">
              <MusicIcon className="mr-2 h-4 w-4" />
              Track Mixer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="loops">
            <div className="grid gap-8 md:grid-cols-[1fr_300px]">
              <div>
                <h2 className="text-2xl font-bold mb-4">Recorded Loops</h2>
                {loops.length === 0 ? (
                  <Card className="w-full border-border/50">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="rounded-full bg-purple-100 p-3 mb-4 dark:bg-purple-900/20">
                        <MusicIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-xl font-medium mb-2">No Loops Yet</h3>
                      <p className="text-muted-foreground text-center max-w-md mb-6">
                        Record your first loop to start building your jam session.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {loops.map((loop) => (
                      <Card
                        key={loop.id}
                        className="w-full border-border/50 hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{loop.name}</h3>
                              <div className="text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5" />
                                  <span>Created by {loop.userName || "Unknown User"}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isDeleting === loop.id ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled
                                  className="border-purple-200 dark:border-purple-800"
                                >
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Deleting...
                                </Button>
                              ) : (
                                <>
                                  {playingLoopId === loop.id ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => stopLoop(loop.id)}
                                      className="border-purple-200 dark:border-purple-800"
                                    >
                                      <StopCircle className="mr-2 h-4 w-4" />
                                      Stop
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => playLoop(loop.id)}
                                      className="border-purple-200 dark:border-purple-800"
                                    >
                                      <PlayCircle className="mr-2 h-4 w-4" />
                                      Play
                                    </Button>
                                  )}
                                  {/* Always show delete button for all loops */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteLoop(loop.id)}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                                    disabled={isDeleting === loop.id}
                                  >
                                    {isDeleting === loop.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="flex items-center gap-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-0 h-8 w-8"
                                onClick={() => toggleMute(loop.id)}
                              >
                                {mutedLoops[loop.id] ? (
                                  <VolumeX className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Volume2 className="h-4 w-4" />
                                )}
                              </Button>
                              <Slider
                                defaultValue={[80]}
                                value={[loopVolumes[loop.id] || 80]}
                                max={100}
                                step={1}
                                className="flex-1"
                                onValueChange={(value) => handleVolumeChange(loop.id, value)}
                              />
                              <span className="text-xs text-muted-foreground w-8 text-right">
                                {loopVolumes[loop.id] || 80}%
                              </span>
                            </div>

                            {/* Waveform visualization */}
                            <AudioWaveform
                              audioUrl={`/api/loops/${loop.id}/audio`}
                              token={localStorage.getItem("token") || ""}
                              playing={playingLoopId === loop.id}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4">Record New Loop</h2>
                <Card className="w-full border-border/50">
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="loopName" className="text-sm font-medium">
                        Loop Name
                      </label>
                      <Input
                        id="loopName"
                        placeholder="My awesome guitar riff"
                        value={newLoopName}
                        onChange={(e) => setNewLoopName(e.target.value)}
                        disabled={isRecording}
                        className="border-input/50 focus-visible:ring-purple-500"
                      />
                    </div>

                    <div className="flex justify-center py-4">
                      {isRecording ? (
                        <div className="text-center w-full">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-2 animate-pulse dark:bg-red-900/20 dark:text-red-400">
                            <StopCircle className="h-8 w-8" />
                          </div>
                          <div className="text-xl font-bold flex items-center justify-center gap-2">
                            {formatTime(recordingTime)}
                          </div>
                          <div className="text-sm text-muted-foreground mb-4">Recording... (max 30s)</div>

                          {/* Live waveform visualization */}
                          <div className="h-16 mb-4 bg-purple-50 dark:bg-purple-900/10 rounded-md overflow-hidden">
                            <WaveformVisualizer data={recordingData} color="rgb(220, 38, 38)" />
                          </div>

                          <Button variant="destructive" onClick={stopRecording} className="transition-all duration-200">
                            <StopCircle className="mr-2 h-4 w-4" />
                            Stop Recording
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-2 dark:bg-purple-900/20 dark:text-purple-400">
                            <Mic className="h-8 w-8" />
                          </div>
                          <div className="text-sm text-muted-foreground mb-4">Click to start recording (max 30s)</div>
                          <Button
                            className="bg-purple-600 hover:bg-purple-700 transition-all duration-200"
                            onClick={startRecording}
                          >
                            <Mic className="mr-2 h-4 w-4" />
                            Start Recording
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t">
                      <h3 className="text-sm font-medium mb-2">Tips:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Make sure your microphone is connected</li>
                        <li>• Try to record in a quiet environment</li>
                        <li>• Keep loops short for better layering</li>
                        <li>• Record to the BPM for better sync</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mixer">
            <TrackMixer loops={loops} onDeleteLoop={deleteLoop} />
          </TabsContent>
        </Tabs>
      </main>
         </div>
  )
}
