import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GameCard from "@/components/GameCard";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { loadGames } from "@/data/store";
import { loadAnnouncements } from "@/data/store";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | "bestsellers" | "new">("all");
  const games = loadGames();
  const announcements = loadAnnouncements();
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session?.user);
    });
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session?.user));
    return () => subscription.unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = games;
    if (category === "bestsellers") {
      base = games.filter((g) => g.tags.some((t) => /bestseller(s)?/i.test(t)));
    } else if (category === "new") {
      base = games.filter((g) => g.tags.some((t) => /\bnew\b|new release(s)?/i.test(t)));
    }
    if (!q) return base;
    return base.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [games, query, category]);

  const firstRow = filtered.slice(0, 3);
  const rest = filtered.slice(3);
  const banner = announcements[0];

  return (
    <>
      <Helmet>
        <title>Browse Games | Neon Game Store</title>
        <meta name="description" content="Browse neon-styled digital games, DLCs and editions. Find your next favorite game." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/'} />
      </Helmet>

      <header className="py-8">
        <div className="container">
          <div className="flex items-center justify-between">
            <Link to="/" className="story-link text-xl font-display">Neon Game Store</Link>
            <div className="flex items-center gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link to="/auth">{loggedIn ? "Account" : "Sign In"}</Link>
              </Button>
              {loggedIn && (
                <Button variant="destructive" size="sm" onClick={async () => { await supabase.auth.signOut(); setLoggedIn(false); }}>
                  Log out
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container pb-16">
        {banner && (
          <section className="mb-6" aria-label="Top announcement banner">
            <AnnouncementBanner image={banner.image} alt={banner.alt} href={banner.href} />
          </section>
        )}
        <section className="mb-6">
          <h1 className="sr-only">Browse Games</h1>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search games or tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search games"
            />
          </div>
          <div className="mt-4">
            <Tabs value={category} onValueChange={(v) => setCategory(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="bestsellers">Bestsellers</TabsTrigger>
                <TabsTrigger value="new">New Releases</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </section>

        <Separator className="my-4" />

        <section aria-label="Game listings">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {firstRow.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
          {/* Top banner already shown above if present */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
};

export default Index;
