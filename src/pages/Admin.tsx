import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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

const Admin = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [ann, setAnn] = useState<Announcement[]>([]);

  useEffect(() => {
    setGames(loadGames());
    setAnn(loadAnnouncements());
  }, []);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<string>("");
  const [tags, setTags] = useState<string>("");

  const addGame = () => {
    if (!title || !price) return;
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newGame: Game = {
      id,
      title,
      cover: defaultGames[0].cover,
      price: parseFloat(price),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      description: `New listing: ${title}.`,
      editions: [{ id: "standard", name: "Standard", price: parseFloat(price), includesBase: true }],
      dlcs: [],
    };
    const next = [newGame, ...games];
    setGames(next);
    saveGames(next);
    setTitle(""); setPrice(""); setTags("");
    toast.success("Game added");
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

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const generateAI = async () => {
    // Mocked generator for now
    setAiResult("Generating...");
    await new Promise((r) => setTimeout(r, 600));
    const tags = aiPrompt
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 5)
      .map((w) => w.replace(/[^a-z]/gi, "").toLowerCase());
    setAiResult(
      `Engage in ${aiPrompt || "your new game"}. Features responsive controls, stylish visuals, and replayable challenges. Suggested tags: ${tags.join(", ")}`
    );
  };

  return (
    <>
      <Helmet>
        <title>Admin Portal | Neon Game Store</title>
        <meta name="description" content="Manage games, DLCs, announcements and generate AI descriptions." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/'} />
      </Helmet>

      <main className="container py-10">
        <h1 className="font-display text-3xl mb-6">Admin Portal</h1>

        <Tabs defaultValue="games">
          <TabsList>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="dlc">DLC</TabsTrigger>
            <TabsTrigger value="ann">Announcements</TabsTrigger>
            <TabsTrigger value="ai">AI Description</TabsTrigger>
          </TabsList>

          <TabsContent value="games" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Game</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div className="md:col-span-3">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} />
                </div>
                <div className="md:col-span-3">
                  <Button variant="hero" onClick={addGame}>Add Game</Button>
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

          <TabsContent value="ai" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Game Description</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div>
                  <Label htmlFor="aiprompt">Brief</Label>
                  <Input id="aiprompt" placeholder="e.g., cyberpunk racer with drifting mechanics" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <Button variant="hero" onClick={generateAI}>Generate</Button>
                  <Button variant="secondary" onClick={() => { setAiPrompt(""); setAiResult(""); }}>Clear</Button>
                </div>
                {aiResult && (
                  <div className="rounded-md border p-4 text-sm text-muted-foreground whitespace-pre-wrap">{aiResult}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
};

export default Admin;
