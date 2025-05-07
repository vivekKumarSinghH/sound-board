"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/hooks/use-auth"
import { MusicIcon, HomeIcon, PlusIcon, CompassIcon, LogOutIcon, MenuIcon } from "lucide-react"

export function SimpleSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const routes = [
    {
      name: "Home",
      path: "/",
      icon: <HomeIcon className="h-5 w-5" />,
    },
    {
      name: "My Jam Rooms",
      path: "/dashboard",
      icon: <MusicIcon className="h-5 w-5" />,
    },
    {
      name: "Explore",
      path: "/explore",
      icon: <CompassIcon className="h-5 w-5" />,
    },
    {
      name: "Create Jam Room",
      path: "/dashboard",
      icon: <PlusIcon className="h-5 w-5" />,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2 px-2">
                  <MusicIcon className="h-6 w-6 text-purple-600" />
                  <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent font-extrabold text-xl">
                    SoundBoard
                  </span>
                </div>
                <nav className="flex flex-col gap-2">
                  {routes.map((route) => (
                    <Link
                      key={route.path + route.name}
                      href={route.path}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${
                        pathname === route.path
                          ? "bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-400"
                          : "hover:bg-muted"
                      }`}
                    >
                      {route.icon}
                      <span>{route.name}</span>
                    </Link>
                  ))}
                </nav>
                {user ? (
                  <div className="flex flex-col gap-2 mt-auto">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Button variant="outline" size="sm" className="justify-start" onClick={logout}>
                      <LogOutIcon className="h-4 w-4 mr-2" />
                      <span>Logout</span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mt-auto">
                    <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                      <Link href="/login" onClick={() => setOpen(false)}>
                        Login
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/signup" onClick={() => setOpen(false)}>
                        Sign Up
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center gap-2 font-bold ml-2 md:ml-0">
            <MusicIcon className="h-5 w-5 text-purple-600" />
            <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent font-extrabold">
              SoundBoard
            </span>
          </Link>
          <nav className="hidden md:flex flex-1 items-center justify-center">
            {routes.map((route) => (
              <Link
                key={route.path + route.name}
                href={route.path}
                className={`flex items-center gap-2 px-3 py-2 mx-1 rounded-md ${
                  pathname === route.path
                    ? "bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-400"
                    : "hover:bg-muted"
                }`}
              >
                {route.icon}
                <span>{route.name}</span>
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <Button variant="ghost" size="sm" onClick={logout} className="hidden md:flex">
                <LogOutIcon className="mr-2 h-4 w-4" />
                Logout
              </Button>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
