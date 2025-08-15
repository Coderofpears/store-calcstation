import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { toast } from "sonner";
import { defaultGames, type Game } from "@/data/games";
import {
  loadGames,
  saveGames,
  loadAnnouncements,
  saveAnnouncements,
  type Announcement,
} from "@/data/store";
import { fileToDataUrl } from "@/utils/base64";
import { supabase } from "@/integrations/supabase/client";

interface GameVersion {
  id: string;
  name: string;
  devices: DeviceDownload[];
}

interface DeviceDownload {
  id: string;
  device: string;
  fileName: string;
  fileExtension: string;
  fileData: string;
}

const Admin = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [ann, setAnn] = useState<Announcement[]>([]);

  useEffect(() => {
    setGames(loadGames());
    setAnn(loadAnnouncements());
  }, []);

  // Game form state
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [description, setDescription] = useState("");
  const [gameImages, setGameImages] = useState<string[]>([]);
  const [versions, setVersions] = useState<GameVersion[]>([]);
  const [releaseDate, setReleaseDate] = useState<string>("");
  const [isPreorder, setIsPreorder] = useState(false);

  const addGameImage = async (file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      setGameImages(prev => [...prev, dataUrl]);
      toast.success("Image added");
    } catch (error) {
      toast.error("Failed to add image");
    }
  };

  const removeGameImage = (index: number) => {
    setGameImages(prev => prev.filter((_, i) => i !== index));
  };

  const addVersion = () => {
    const newVersion: GameVersion = {
      id: `version-${Date.now()}`,
      name: `Version ${versions.length + 1}`,
      devices: []
    };
    setVersions(prev => [...prev, newVersion]);
  };

  const removeVersion = (versionId: string) => {
    setVersions(prev => prev.filter(v => v.id !== versionId));
  };

  const updateVersionName = (versionId: string, name: string) => {
    setVersions(prev => prev.map(v => v.id === versionId ? { ...v, name } : v));
  };

  const addDeviceToVersion = (versionId: string, device: string) => {
    const newDevice: DeviceDownload = {
      id: `device-${Date.now()}`,
      device,
      fileName: "",
      fileExtension: "",
      fileData: ""
    };
    setVersions(prev => prev.map(v => 
      v.id === versionId ? { ...v, devices: [...v.devices, newDevice] } : v
    ));
  };

  const removeDeviceFromVersion = (versionId: string, deviceId: string) => {
    setVersions(prev => prev.map(v => 
      v.id === versionId ? { ...v, devices: v.devices.filter(d => d.id !== deviceId) } : v
    ));
  };

  const updateDeviceFile = async (versionId: string, deviceId: string, file: File, fileName: string, extension: string) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      setVersions(prev => prev.map(v => 
        v.id === versionId ? {
          ...v,
          devices: v.devices.map(d => 
            d.id === deviceId ? { ...d, fileName, fileExtension: extension, fileData: dataUrl } : d
          )
        } : v
      ));
      toast.success("File uploaded");
    } catch (error) {
      toast.error("Failed to upload file");
    }
  };

  const addGame = async () => {
    if (!title || !price || !description) return;
    
    try {
      const gameSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      
      // Save to Supabase games table
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      
      if (user) {
        const { error: gameError } = await supabase.from("games").insert({
          slug: gameSlug,
          title,
          description,
          price: parseFloat(price),
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          cover_base64: gameImages[0] || null,
          release_date: releaseDate ? new Date(releaseDate).toISOString() : null,
          is_preorder_available: isPreorder,
          created_by: user.id
        });

        if (gameError) throw gameError;

        // Save downloads for each version and device
        for (const version of versions) {
          for (const device of version.devices) {
            if (device.fileData && device.fileName) {
              await supabase.from("game_downloads").insert({
                game_slug: gameSlug,
                device: device.device,
                kind: "full",
                file_name: `${device.fileName}.${device.fileExtension}`,
                mime_type: "application/octet-stream",
                data_base64: device.fileData,
                created_by: user.id
              });
            }
          }
        }
      }

      // Also save locally
      const newGame: Game = {
        id: gameSlug,
        title,
        cover: gameImages[0] || defaultGames[0].cover,
        price: parseFloat(price),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        description,
        editions: [{ id: "standard", name: "Standard", price: parseFloat(price), includesBase: true }],
        dlcs: [],
        screenshots: gameImages.slice(1)
      };
      
      const next = [newGame, ...games];
      setGames(next);
      saveGames(next);
      
      // Reset form
      setTitle(""); 
      setPrice(""); 
      setTags(""); 
      setDescription("");
      setGameImages([]);
      setVersions([]);
      setReleaseDate("");
      setIsPreorder(false);
      
      toast.success("Game added successfully");
    } catch (error) {
      console.error("Error adding game:", error);
      toast.error("Failed to add game");
    }
  };

  const deleteGame = (id: string) => {
    const next = games.filter((g) => g.id !== id);
    setGames(next);
    saveGames(next);
    toast.success("Game deleted");
  };

  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const selectedGame = useMemo(() => games.find((g) => g.id === selectedGameId), [games, selectedGameId]);
  const [dlcName, setDlcName] = useState("");
  const [dlcPrice, setDlcPrice] = useState<string>("");

  const addDLC = () => {
    if (!selectedGame) return;
    const dlc = { id: dlcName.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name: dlcName, price: parseFloat(dlcPrice) };
    const next = games.map((g) => (g.id === selectedGame.id ? { ...g, dlcs: [...g.dlcs, dlc] } : g));
    setGames(next);
    saveGames(next);
    setDlcName(""); setDlcPrice("");
    toast.success("DLC added");
  };

  const onUploadAnnouncement = async (file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      const item: Announcement = { id: `${Date.now()}`, image: dataUrl, alt: file.name };
      const next = [item, ...ann].slice(0, 5);
      setAnn(next);
      saveAnnouncements(next);

      // Try to persist in Supabase (optional, requires sign-in)
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (user) {
        await supabase.from("uploads").insert({
          user_id: user.id,
          kind: "image",
          file_name: file.name,
          mime_type: file.type,
          data_base64: dataUrl,
        });
      }
      toast.success("Announcement uploaded");
    } catch (e) {
      console.error(e);
      toast.error("Upload failed");
    }
  };


  return (
    <>
      <Helmet>
        <title>Admin Portal | Neon Game Store</title>
        <meta name="description" content="Manage games, DLCs, and announcements with advanced upload capabilities." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/'} />
      </Helmet>

      <main className="container py-10">
        <h1 className="font-display text-3xl mb-6">Admin Portal</h1>

        <Tabs defaultValue="games">
          <TabsList>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="dlc">DLC</TabsTrigger>
            <TabsTrigger value="ann">Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value="games" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Game</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="price">Price (USD)</Label>
                    <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="releaseDate">Release Date (optional)</Label>
                    <Input 
                      id="releaseDate" 
                      type="date" 
                      value={releaseDate} 
                      onChange={(e) => setReleaseDate(e.target.value)} 
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      id="isPreorder"
                      checked={isPreorder}
                      onChange={(e) => setIsPreorder(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="isPreorder">Available for preorder</Label>
                  </div>
                </div>

                {/* Images Section */}
                <div>
                  <Label>Game Images</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) addGameImage(file);
                      }}
                      className="mb-4"
                    />
                    <div className="grid gap-4 md:grid-cols-3">
                      {gameImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img src={image} alt={`Game image ${index + 1}`} className="w-full h-32 object-cover rounded-md" />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => removeGameImage(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Game Versions Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Game Versions</Label>
                    <Button onClick={addVersion} variant="outline">Add Version</Button>
                  </div>
                  
                  {versions.map((version) => (
                    <Card key={version.id} className="mb-4">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-4">
                          <Input
                            value={version.name}
                            onChange={(e) => updateVersionName(version.id, e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeVersion(version.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2 mb-4">
                          <Input
                            placeholder="Enter device name (e.g., Windows, macOS, Linux)"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const device = e.currentTarget.value.trim();
                                if (device) {
                                  addDeviceToVersion(version.id, device);
                                  e.currentTarget.value = '';
                                }
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            onClick={() => {
                              const input = document.querySelector(`input[placeholder*="Enter device name"]`) as HTMLInputElement;
                              const device = input?.value.trim();
                              if (device) {
                                addDeviceToVersion(version.id, device);
                                input.value = '';
                              }
                            }}
                            variant="outline"
                            size="sm"
                          >
                            Add Device
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          {version.devices.map((device) => (
                            <div key={device.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium">{device.device}</h4>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeDeviceFromVersion(version.id, device.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              <div className="grid gap-4 md:grid-cols-3">
                                <Input
                                  placeholder="File name"
                                  value={device.fileName}
                                  onChange={(e) => {
                                    const fileName = e.target.value;
                                    setVersions(prev => prev.map(v => 
                                      v.id === version.id ? {
                                        ...v,
                                        devices: v.devices.map(d => 
                                          d.id === device.id ? { ...d, fileName } : d
                                        )
                                      } : v
                                    ));
                                  }}
                                />
                                <Input
                                  placeholder="Extension (exe, dmg, etc.)"
                                  value={device.fileExtension}
                                  onChange={(e) => {
                                    const extension = e.target.value;
                                    setVersions(prev => prev.map(v => 
                                      v.id === version.id ? {
                                        ...v,
                                        devices: v.devices.map(d => 
                                          d.id === device.id ? { ...d, fileExtension: extension } : d
                                        )
                                      } : v
                                    ));
                                  }}
                                />
                                <input
                                  type="file"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file && device.fileName && device.fileExtension) {
                                      updateDeviceFile(version.id, device.id, file, device.fileName, device.fileExtension);
                                    }
                                  }}
                                  className="text-sm"
                                />
                              </div>
                              
                              {device.fileData && (
                                <div className="mt-2 text-sm text-green-600">
                                  ✓ File uploaded: {device.fileName}.{device.fileExtension}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div>
                  <Button 
                    variant="hero" 
                    onClick={addGame}
                    disabled={!title || !price || !description}
                    className="w-full"
                  >
                    Add Game
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Separator className="my-6" />

            <div className="grid gap-4">
              {games.map((g) => (
                <Card key={g.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium">{g.title}</div>
                    <div className="text-sm text-muted-foreground">${g.price.toFixed(2)}</div>
                  </div>
                  <Button variant="destructive" onClick={() => deleteGame(g.id)}>Delete</Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="dlc" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Add DLC</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-3">
                  <Label>Game</Label>
                  <select
                    className="mt-1 w-full rounded-md border bg-background p-2"
                    value={selectedGameId}
                    onChange={(e) => setSelectedGameId(e.target.value)}
                  >
                    <option value="">Select a game</option>
                    {games.map((g) => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="dlcname">DLC Name</Label>
                  <Input id="dlcname" value={dlcName} onChange={(e) => setDlcName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="dlcprice">Price (USD)</Label>
                  <Input id="dlcprice" type="number" value={dlcPrice} onChange={(e) => setDlcPrice(e.target.value)} />
                </div>
                <div className="md:col-span-3">
                  <Button variant="hero" onClick={addDLC} disabled={!selectedGameId || !dlcName || !dlcPrice}>Add DLC</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ann" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="annimg">Upload banner image</Label>
                <input
                  id="annimg"
                  type="file"
                  accept="image/*"
                  className="mt-2"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadAnnouncement(f);
                  }}
                />
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {ann.map((a) => (
                    <img key={a.id} src={a.image} alt={a.alt} className="rounded-md shadow-glow" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </>
  );
};

export default Admin;
