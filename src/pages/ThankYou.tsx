import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { loadGames } from "@/data/store";

const ThankYou = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const gameId = params.get("game") || "";
  const games = loadGames();
  const game = useMemo(() => games.find((g) => g.id === gameId), [games, gameId]);
  const orderId = useMemo(() => Math.random().toString(36).slice(2, 10).toUpperCase(), []);

  return (
    <>
      <Helmet>
        <title>Thank You | Neon Game Store</title>
        <meta name="description" content="Purchase complete. Download your game and start playing." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/'} />
      </Helmet>

      <main className="container py-12">
        <h1 className="font-display text-3xl mb-2">Thank you for your purchase</h1>
        <p className="text-muted-foreground mb-6">Order #{orderId}</p>
        {game ? (
          <p className="mb-6">You purchased: <span className="font-medium">{game.title}</span></p>
        ) : (
          <p className="mb-6">Your purchase was successful.</p>
        )}

        <Separator className="my-6" />

        <section aria-label="Download options" className="space-y-4">
          <h2 className="font-display text-xl">Download for your device</h2>
          <p className="text-sm text-muted-foreground">Select your platform to get the installer. Device-specific links will be configured by the admin.</p>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <Button variant="glow" asChild><a href="#" aria-disabled>Windows</a></Button>
            <Button variant="glow" asChild><a href="#" aria-disabled>macOS</a></Button>
            <Button variant="glow" asChild><a href="#" aria-disabled>Linux</a></Button>
            <Button variant="secondary" asChild><a href="#" aria-disabled>Android</a></Button>
            <Button variant="secondary" asChild><a href="#" aria-disabled>iOS</a></Button>
            <Button variant="secondary" asChild><a href="#" aria-disabled>Web</a></Button>
          </div>
          <p className="text-xs text-muted-foreground">Note: Downloads per device and site-specific links will be enabled after admin configuration.</p>
        </section>

        <div className="mt-10 flex gap-3">
          <Button asChild variant="hero"><Link to="/">Back to Store</Link></Button>
          <Button asChild variant="secondary"><Link to="/admin">Admin Portal</Link></Button>
        </div>
      </main>
    </>
  );
};

export default ThankYou;
