"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "next-themes";
import {
  MusicIcon,
  HomeIcon,
  PlusIcon,
  CompassIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
  Users,
} from "lucide-react";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

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
  ];

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
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
                        isActive(route.path)
                          ? "bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-400"
                          : "hover:bg-muted"
                      }`}
                    >
                      {route.icon}
                      <span>{route.name}</span>
                    </Link>
                  ))}
                  <Link
                    href="/dashboard"
                    onClick={() => {
                      setOpen(false);
                      router.push("/dashboard");
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted"
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>Create Jam Room</span>
                  </Link>
                </nav>
                {user ? (
                  <div className="flex flex-col gap-2 mt-auto">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={toggleTheme}
                    >
                      {theme === "dark" ? (
                        <>
                          <SunIcon className="h-4 w-4 mr-2" />
                          <span>Light Mode</span>
                        </>
                      ) : (
                        <>
                          <MoonIcon className="h-4 w-4 mr-2" />
                          <span>Dark Mode</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={logout}
                    >
                      <LogOutIcon className="h-4 w-4 mr-2" />
                      <span>Logout</span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mt-auto">
                    <Button
                      asChild
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
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
          <Link href="/" className="flex items-center gap-2 font-bold">
            <MusicIcon className="h-5 w-5 text-purple-600" />
            <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent font-extrabold">
              SoundBoard
            </span>
          </Link>
          <nav className="hidden md:flex ml-6 space-x-1">
            {routes.map((route) => (
              <Link
                key={route.path + route.name}
                href={route.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                  isActive(route.path)
                    ? "bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-400"
                    : "hover:bg-muted"
                }`}
              >
                {route.icon}
                <span>{route.name}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden md:flex"
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </Button>

          {pathname === "/dashboard" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex border-purple-200 dark:border-purple-800"
                onClick={() => router.push("/dashboard?join=true")}
              >
                <Users className="mr-2 h-4 w-4" />
                Join Room
              </Button>
              <Button
                className="hidden md:flex bg-purple-600 hover:bg-purple-700 transition-all duration-200"
                size="sm"
                onClick={() => router.push("/dashboard?create=true")}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Room
              </Button>
            </>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden md:inline-block">
                {user.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="hidden md:flex"
              >
                <LogOutIcon className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
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
  );
}
