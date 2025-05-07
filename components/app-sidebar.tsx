"use client";

import type React from "react";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import {
  MusicIcon,
  HomeIcon,
  PlusIcon,
  LogOutIcon,
  MoonIcon,
  SunIcon,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 py-2">
              <MusicIcon className="h-6 w-6 text-purple-600" />
              <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent font-extrabold text-xl">
                SoundBoard
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/")}>
                  <Link href="/">
                    <HomeIcon className="h-5 w-5" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                  <Link href="/dashboard">
                    <MusicIcon className="h-5 w-5" />
                    <span>My Jam Rooms</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard">
                    <PlusIcon className="h-5 w-5" />
                    <span>Create Jam Room</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/profile")}>
                  <Link href="/profile">
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 space-y-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
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

            {user ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 p-2 rounded-md border">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={`https://avatar.vercel.sh/${user.id}`}
                      alt={user.name}
                    />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={logout}
                >
                  <LogOutIcon className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  asChild
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 flex flex-col">
          <div className="flex items-center h-16 px-4 border-b">
            <SidebarTrigger />
            <div className="ml-4 font-medium">
              {pathname === "/" && "Home"}
              {pathname === "/dashboard" && "My Jam Rooms"}
              {pathname.startsWith("/jam-room/") && "Jam Room"}
              {pathname === "/login" && "Login"}
              {pathname === "/signup" && "Sign Up"}
            </div>
          </div>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
