import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MusicIcon, Headphones, Users, Download } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-purple-50 dark:from-background dark:to-background">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                      Collaborative
                    </span>{" "}
                    Jam Sessions
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Create, record, and share audio loops with musicians around
                    the world. No complex DAWs required.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Start Jamming
                    </Button>
                  </Link>
                  <Link href="/explore">
                    <Button size="lg" variant="outline">
                      Explore Public Jams
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative mx-auto aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-1 shadow-2xl sm:w-full lg:order-last">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <img
                  src="/placeholder.svg?key=136t8"
                  alt="Musicians collaborating"
                  width={550}
                  height={550}
                  className="mx-auto aspect-video overflow-hidden rounded-lg object-cover sm:w-full"
                />
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-purple-50 dark:bg-slate-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  How It Works
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Create jam rooms, record loops, collaborate with friends, and
                  export your final mix.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-400">
                  <MusicIcon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Create a Jam Room</h3>
                <p className="text-muted-foreground">
                  Set up a room with your preferred BPM, key signature, and
                  invite collaborators.
                </p>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-400">
                  <Headphones className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Record Audio Loops</h3>
                <p className="text-muted-foreground">
                  Record up to 30-second loops directly in your browser. No
                  special equipment needed.
                </p>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-400">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Collaborate in Real-Time</h3>
                <p className="text-muted-foreground">
                  See new loops from collaborators appear in real-time. Mix and
                  match to create the perfect jam.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Features
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need to create amazing collaborative music.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-2 lg:gap-12">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-400">
                    <MusicIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Jam Room Management</h3>
                </div>
                <p className="mt-3 text-muted-foreground">
                  Create rooms with custom BPM, key signature, and invite
                  collaborators with a unique room code.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-400">
                    <Headphones className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Loop Recording</h3>
                </div>
                <p className="mt-3 text-muted-foreground">
                  Record high-quality audio loops up to 30 seconds directly in
                  your browser with waveform visualization.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                    >
                      <path d="M2 17h12v5H2z" />
                      <path d="M8 17v-5H2v5" />
                      <path d="M14 17v-5h-4v5" />
                      <path d="M8 12V7H6v5" />
                      <path d="M16 12h-4" />
                      <path d="M15 7h5v10h-5" />
                      <path d="M15 7v10" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Track Mixer</h3>
                </div>
                <p className="mt-3 text-muted-foreground">
                  Mix and match loops with volume controls and effects to create
                  the perfect sound.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-400">
                    <Download className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Export Mixdown</h3>
                </div>
                <p className="mt-3 text-muted-foreground">
                  Combine all your loops into a single high-quality audio file
                  that you can download and share.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
