import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Game } from "@/data/games";

interface Props {
  game: Game;
}

const GameCard = ({ game }: Props) => {
  return (
    <Card className="overflow-hidden border-border/50 bg-card/80 hover:bg-card transition-colors shadow-glow">
      <Link to={`/game/${game.id}`} aria-label={`View ${game.title}`}>
        <img
          src={game.cover}
          alt={`${game.title} cover art`}
          loading="lazy"
          className="aspect-[3/4] w-full object-cover hover:opacity-95"
        />
      </Link>
      <CardContent className="p-4">
        <h3 className="font-display text-lg mb-1">{game.title}</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {game.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary">{t}</Badge>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">From ${game.price.toFixed(2)}</span>
          <Button asChild variant="glow" size="sm">
            <Link to={`/game/${game.id}`}>View</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameCard;
