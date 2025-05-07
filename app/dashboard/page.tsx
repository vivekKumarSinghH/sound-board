"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MusicIcon, PlusIcon, Loader2, Users, Lock, Globe } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Types for our app
interface JamRoom {
  id: string;
  title: string;
  bpm: number;
  keySignature: string;
  isPublic: boolean;
  hostId: string;
  hostName: string;
  code: string;
  createdAt: string;
  hasPassword: boolean;
}

export default function DashboardPage() {
  const [myRooms, setMyRooms] = useState<JamRoom[]>([]);
  const [publicRooms, setPublicRooms] = useState<JamRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    title: "",
    bpm: 120,
    keySignature: "C",
    isPublic: true,
    password: "",
  });
  const [joinRoomData, setJoinRoomData] = useState({
    roomCode: "",
    password: "",
  });
  const [activeTab, setActiveTab] = useState("my-rooms");

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();

  // Check URL parameters for dialog control
  useEffect(() => {
    if (searchParams) {
      const create = searchParams.get("create");
      const join = searchParams.get("join");

      if (create === "true") {
        setIsCreateDialogOpen(true);
      }

      if (join === "true") {
        setIsJoinDialogOpen(true);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    fetchRooms();
  }, [user, isAuthLoading, router]);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);

      // Fetch my rooms
      const myRoomsResponse = await fetch("/api/rooms?filter=my", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!myRoomsResponse.ok) {
        throw new Error("Failed to fetch rooms");
      }

      const myRoomsData = await myRoomsResponse.json();
      setMyRooms(myRoomsData.rooms);

      // Fetch public rooms
      const publicRoomsResponse = await fetch("/api/rooms?filter=public", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!publicRoomsResponse.ok) {
        throw new Error("Failed to fetch public rooms");
      }

      const publicRoomsData = await publicRoomsResponse.json();
      setPublicRooms(publicRoomsData.rooms);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load jam rooms",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createRoom = async () => {
    if (!user) return;

    setIsCreatingRoom(true);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newRoom),
      });

      if (!response.ok) {
        throw new Error("Failed to create room");
      }

      const data = await response.json();

      toast({
        title: "Jam Room Created",
        description: `Your room "${newRoom.title}" is ready!`,
      });

      setIsCreateDialogOpen(false);

      // Reset form
      setNewRoom({
        title: "",
        bpm: 120,
        keySignature: "C",
        isPublic: true,
        password: "",
      });

      // Clear URL parameters
      router.push("/dashboard");

      // Navigate to the new room
      router.push(`/jam-room/${data.room.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create jam room",
        variant: "destructive",
      });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const joinRoom = async () => {
    if (!user) return;

    setIsJoiningRoom(true);

    try {
      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(joinRoomData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to join room");
      }

      const data = await response.json();

      toast({
        title: "Joined Jam Room",
        description: `You've joined "${data.room.title}"!`,
      });

      setIsJoinDialogOpen(false);

      // Reset form
      setJoinRoomData({
        roomCode: "",
        password: "",
      });

      // Clear URL parameters
      router.push("/dashboard");

      // Navigate to the room
      router.push(`/jam-room/${data.room.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to join jam room",
        variant: "destructive",
      });
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleDialogClose = (type: "create" | "join") => {
    if (type === "create") {
      setIsCreateDialogOpen(false);
    } else {
      setIsJoinDialogOpen(false);
    }

    // Clear URL parameters
    router.push("/dashboard");
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <div className="text-center">Loading your jam rooms...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-purple-50 dark:from-background dark:to-background">
      <main className="flex-1 container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Jam Rooms</h1>
          <div className="flex gap-2">
            <Dialog
              open={isJoinDialogOpen}
              onOpenChange={(open) => {
                setIsJoinDialogOpen(open);
                if (!open) router.push("/dashboard");
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join a Jam Room</DialogTitle>
                  <DialogDescription>
                    Enter the room code to join an existing jam session.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="roomCode">Room Code</Label>
                    <Input
                      id="roomCode"
                      value={joinRoomData.roomCode}
                      onChange={(e) =>
                        setJoinRoomData({
                          ...joinRoomData,
                          roomCode: e.target.value,
                        })
                      }
                      placeholder="Enter room code (e.g. ABC123)"
                      className="border-input/50 focus-visible:ring-purple-500"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password (if required)</Label>
                    <Input
                      id="password"
                      type="password"
                      value={joinRoomData.password}
                      onChange={(e) =>
                        setJoinRoomData({
                          ...joinRoomData,
                          password: e.target.value,
                        })
                      }
                      placeholder="Enter password for private rooms"
                      className="border-input/50 focus-visible:ring-purple-500"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => handleDialogClose("join")}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={joinRoom}
                    disabled={!joinRoomData.roomCode || isJoiningRoom}
                  >
                    {isJoiningRoom ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      "Join Room"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                setIsCreateDialogOpen(open);
                if (!open) router.push("/dashboard");
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Jam Room</DialogTitle>
                  <DialogDescription>
                    Set up your jam session details. You'll be able to invite
                    others once it's created.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Room Title</Label>
                    <Input
                      id="title"
                      value={newRoom.title}
                      onChange={(e) =>
                        setNewRoom({ ...newRoom, title: e.target.value })
                      }
                      placeholder="My Awesome Jam Session"
                      className="border-input/50 focus-visible:ring-purple-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="bpm">BPM</Label>
                      <Input
                        id="bpm"
                        type="number"
                        value={newRoom.bpm}
                        onChange={(e) =>
                          setNewRoom({
                            ...newRoom,
                            bpm: Number.parseInt(e.target.value),
                          })
                        }
                        min={40}
                        max={240}
                        className="border-input/50 focus-visible:ring-purple-500"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="key">Key Signature</Label>
                      <Select
                        value={newRoom.keySignature}
                        onValueChange={(value) =>
                          setNewRoom({ ...newRoom, keySignature: value })
                        }
                      >
                        <SelectTrigger
                          id="key"
                          className="border-input/50 focus-visible:ring-purple-500"
                        >
                          <SelectValue placeholder="Select key" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="C">C Major</SelectItem>
                          <SelectItem value="G">G Major</SelectItem>
                          <SelectItem value="D">D Major</SelectItem>
                          <SelectItem value="A">A Major</SelectItem>
                          <SelectItem value="E">E Major</SelectItem>
                          <SelectItem value="F">F Major</SelectItem>
                          <SelectItem value="Bb">Bb Major</SelectItem>
                          <SelectItem value="Am">A Minor</SelectItem>
                          <SelectItem value="Em">E Minor</SelectItem>
                          <SelectItem value="Dm">D Minor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="public"
                        checked={newRoom.isPublic}
                        onCheckedChange={(checked) =>
                          setNewRoom({ ...newRoom, isPublic: checked })
                        }
                      />
                      <Label htmlFor="public">Make this jam room public</Label>
                    </div>
                  </div>
                  {!newRoom.isPublic && (
                    <div className="grid gap-2">
                      <Label htmlFor="password">Room Password (optional)</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newRoom.password}
                        onChange={(e) =>
                          setNewRoom({ ...newRoom, password: e.target.value })
                        }
                        placeholder="Set a password for your private room"
                        className="border-input/50 focus-visible:ring-purple-500"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave blank for no password. Others will need the room
                        code to join.
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => handleDialogClose("create")}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={createRoom}
                    disabled={!newRoom.title || isCreatingRoom}
                  >
                    {isCreatingRoom ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Room"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs
          defaultValue="my-rooms"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="my-rooms">My Rooms</TabsTrigger>
            <TabsTrigger value="public-rooms">Public Rooms</TabsTrigger>
          </TabsList>

          <TabsContent value="my-rooms">
            {myRooms.length === 0 ? (
              <Card className="w-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-purple-100 p-3 mb-4 dark:bg-purple-900/20">
                    <MusicIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">No Jam Rooms Yet</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    Create your first jam room to start recording and
                    collaborating with other musicians.
                  </p>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 transition-all duration-200"
                    onClick={() => router.push("/dashboard?create=true")}
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create Your First Jam Room
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {myRooms.map((room) => (
                  <Link href={`/jam-room/${room.id}`} key={room.id}>
                    <Card className="h-full overflow-hidden hover:shadow-md transition-shadow border-border/50 hover:border-purple-200 dark:hover:border-purple-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                          {room.title}
                          {!room.isPublic && (
                            <Lock className="h-4 w-4 text-amber-500" />
                          )}
                        </CardTitle>
                        <CardDescription>
                          {room.isPublic ? "Public" : "Private"} • {room.bpm}{" "}
                          BPM • Key: {room.keySignature}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Room Code:{" "}
                          <span className="font-mono">{room.code}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created:{" "}
                          {new Date(room.createdAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full bg-purple-600 hover:bg-purple-700 transition-all duration-200">
                          Enter Jam Room
                        </Button>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="public-rooms">
            {publicRooms.length === 0 ? (
              <Card className="w-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-purple-100 p-3 mb-4 dark:bg-purple-900/20">
                    <Globe className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">
                    No Public Rooms Available
                  </h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    There are no public jam rooms available at the moment.
                    Create your own or join one with a room code.
                  </p>
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => router.push("/dashboard?join=true")}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Join with Code
                    </Button>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700 transition-all duration-200"
                      onClick={() => router.push("/dashboard?create=true")}
                    >
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Create Room
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {publicRooms.map((room) => (
                  <Link href={`/jam-room/${room.id}`} key={room.id}>
                    <Card className="h-full overflow-hidden hover:shadow-md transition-shadow border-border/50 hover:border-purple-200 dark:hover:border-purple-800">
                      <CardHeader className="pb-2">
                        <CardTitle>{room.title}</CardTitle>
                        <CardDescription>
                          Public • {room.bpm} BPM • Key: {room.keySignature}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Host: {room.hostName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created:{" "}
                          {new Date(room.createdAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full bg-purple-600 hover:bg-purple-700 transition-all duration-200">
                          Join Jam Room
                        </Button>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
