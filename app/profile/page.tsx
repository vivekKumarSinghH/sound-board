"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Loader2, MusicIcon, Headphones, Download, User } from "lucide-react"

interface UserStats {
  totalRoomsHosted: number
  totalLoopsRecorded: number
  totalMixdownExports: number
  averageLoopsPerSession: string
}

interface UserProfile {
  id: string
  name: string
  email: string
  createdAt: string
}

export default function ProfilePage() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading: isAuthLoading } = useAuth()

  useEffect(() => {
    if (isAuthLoading) return

    if (!user) {
      router.push("/login")
      return
    }

    fetchUserStats()
  }, [user, isAuthLoading, router])

  const fetchUserStats = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/users/stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch user stats")
      }

      const data = await response.json()
      setStats(data.stats)
      setProfile(data.user)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load user statistics",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <div className="text-center">Loading profile data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-purple-50 dark:from-background dark:to-background">
      <main className="flex-1 container py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="flex items-center gap-1 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Your Profile</h1>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_300px]">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/20">
                <MusicIcon className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold">Activity Analytics</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="overflow-hidden border-purple-100 dark:border-purple-800/30 hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-purple-400 to-pink-500"></div>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/20">
                      <MusicIcon className="h-4 w-4 text-purple-600" />
                    </div>
                    Jam Rooms Hosted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <div className="text-4xl font-bold text-purple-600">{stats?.totalRoomsHosted || 0}</div>
                    <div className="text-sm text-muted-foreground mb-1">rooms</div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Total rooms you've created</p>
                  <div className="mt-4 h-1 w-full bg-purple-100 dark:bg-purple-900/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
                      style={{ width: `${Math.min(100, (stats?.totalRoomsHosted || 0) * 10)}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-purple-100 dark:border-purple-800/30 hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                      <Headphones className="h-4 w-4 text-blue-600" />
                    </div>
                    Loops Recorded
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <div className="text-4xl font-bold text-blue-600">{stats?.totalLoopsRecorded || 0}</div>
                    <div className="text-sm text-muted-foreground mb-1">loops</div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Total audio loops you've created</p>
                  <div className="mt-4 h-1 w-full bg-blue-100 dark:bg-blue-900/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                      style={{ width: `${Math.min(100, (stats?.totalLoopsRecorded || 0) * 5)}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-purple-100 dark:border-purple-800/30 hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-pink-400 to-red-500"></div>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="rounded-full bg-pink-100 p-2 dark:bg-pink-900/20">
                      <Download className="h-4 w-4 text-pink-600" />
                    </div>
                    Mixdown Exports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <div className="text-4xl font-bold text-pink-600">{stats?.totalMixdownExports || 0}</div>
                    <div className="text-sm text-muted-foreground mb-1">exports</div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Total mixdowns you've exported</p>
                  <div className="mt-4 h-1 w-full bg-pink-100 dark:bg-pink-900/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-400 to-red-500 rounded-full"
                      style={{ width: `${Math.min(100, (stats?.totalMixdownExports || 0) * 20)}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-purple-100 dark:border-purple-800/30 hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-400 to-orange-500"></div>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/20">
                      <MusicIcon className="h-4 w-4 text-amber-600" />
                    </div>
                    Average Loops Per Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <div className="text-4xl font-bold text-amber-600">{stats?.averageLoopsPerSession || "0"}</div>
                    <div className="text-sm text-muted-foreground mb-1">loops/session</div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Average loops in your jam sessions</p>
                  <div className="mt-4 h-1 w-full bg-amber-100 dark:bg-amber-900/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                      style={{
                        width: `${Math.min(100, Number.parseFloat(stats?.averageLoopsPerSession || "0") * 20)}%`,
                      }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/20">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold">Account Info</h2>
            </div>

            <Card className="overflow-hidden border-purple-100 dark:border-purple-800/30 hover:shadow-md transition-shadow">
              <div className="h-24 bg-gradient-to-r from-purple-600 to-pink-500"></div>
              <div className="px-6 pb-6">
                <div className="flex flex-col items-center -mt-12">
                  <div className="rounded-full bg-white p-3 shadow-md dark:bg-gray-800">
                    <User className="h-12 w-12 text-purple-600" />
                  </div>
                  <h3 className="mt-3 text-xl font-bold">{profile?.name}</h3>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>

                  <div className="w-full mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">Member since</span>
                      <span className="text-sm text-muted-foreground">
                        {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Unknown"}
                      </span>
                    </div>

                    <Button variant="outline" className="w-full border-purple-200 dark:border-purple-800 mt-2">
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="mt-6 overflow-hidden border-purple-100 dark:border-purple-800/30 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Activity Level</span>
                    <span className="text-sm font-medium text-purple-600">
                      {(stats?.totalLoopsRecorded || 0) > 10
                        ? "Advanced"
                        : (stats?.totalLoopsRecorded || 0) > 5
                          ? "Intermediate"
                          : "Beginner"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Active</span>
                    <span className="text-sm font-medium">Today</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Account Type</span>
                    <span className="text-sm font-medium">Standard</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
