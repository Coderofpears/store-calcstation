import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { loadGames, addOwned, loadOwned } from "@/data/store";

const GameDetail = () => {
  const { id } = useParams();
  const games = loadGames();
  const game = useMemo(() => games.find((g) => g.id === id), [games, id]);
  const owned = new Set(loadOwned());
  const [open, setOpen] = useState(false);
  const [edition, setEdition] = useState(game?.editions?.[0]?.id || "standard");
  const navigate = useNavigate();

  if (!game) {
    return (
      <main className="container py-24 text-center">
        <h1 className="font-display text-2xl mb-2">Game not found</h1>
        <p className="text-muted-foreground mb-6">The game you're looking for doesn't exist.</p>
        <Button asChild variant="glow"><Link to="/">Back to store</Link></Button>
      </main>
    );
  }

  const alreadyOwned = owned.has(game.id);

  const selectedEdition = game.editions.find((e) => e.id === edition) || game.editions[0];

  const price = selectedEdition?.price ?? game.price;

  const handlePurchase = () => {
    addOwned(game.id);
    toast.success("Purchase completed (simulated)");
    setOpen(false);
    navigate(`/thank-you?game=${game.id}`);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: game.title,
    image: [game.cover],
    description: game.description,
    brand: { "@type": "Brand", name: "Neon Game Store" },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: price,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <Helmet>
        <title>{`${game.title} | Neon Game Store`}</title>
        <meta name="description" content={game.description} />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/'} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main className="container py-10">
        <header className="flex items-center justify-between mb-6">
          <Link to="/" className="story-link">Back</Link>
          <Button asChild variant="hero" size="sm"><Link to="/admin">Admin</Link></Button>
        </header>

        <section className="grid gap-8 md:grid-cols-2">
          <Card className="overflow-hidden shadow-glow">
            <img src={game.cover} alt={`${game.title} cover art`} className="w-full object-cover" />
          </Card>
          <div>
            <h1 className="font-display text-3xl mb-2">{game.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {game.tags.map((t) => (
                <Badge key={t} variant="secondary">{t}</Badge>
              ))}
            </div>
            <p className="text-muted-foreground mb-4">{game.description}</p>

            <Separator className="my-4" />
            <div className="mb-4">
              <h2 className="font-display text-xl mb-2">Editions</h2>
              {alreadyOwned && (
                <p className="text-sm text-accent-foreground/80 mb-2">
                  You already own the base game. Choosing base-included editions may duplicate ownership.
                </p>
              )}
              <RadioGroup value={edition} onValueChange={setEdition} className="grid gap-3">
                {game.editions.map((e) => (
                  <Label key={e.id} className="flex items-center justify-between rounded-md border p-3 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem id={e.id} value={e.id} />
                      <span>{e.name}</span>
                    </div>
                    <span className="text-muted-foreground">${e.price.toFixed(2)}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="hero" onClick={() => setOpen(true)}>
                Buy Now — ${price.toFixed(2)}
              </Button>
              <span className="text-sm text-muted-foreground">Secure checkout (simulated)</span>
            </div>

            <Separator className="my-6" />

            <div>
              <h2 className="font-display text-xl mb-3">Downloadable Content</h2>
              <div className="grid gap-3">
                {game.dlcs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between border rounded-md p-3">
                    <div className="flex items-center gap-3">
                      <span>{d.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">${d.price.toFixed(2)}</span>
                      <Button
                        variant="glow"
                        size="sm"
                        onClick={() => {
                          toast.success(`Added ${d.name} (simulated)`);
                        }}
                      >
                        Buy DLC
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Purchase</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            This is a demo checkout. No real payment will be processed.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={handlePurchase}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GameDetail;
