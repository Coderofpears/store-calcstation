import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface Purchase {
  id: string;
  game_slug: string;
  edition: string;
  created_at: string;
  is_preorder: boolean;
  preorder_release_date: string | null;
  order_status: string;
}

export default function PurchaseHistory() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPurchases() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching purchases:', error);
      } else {
        setPurchases(data || []);
      }
      setLoading(false);
    }

    fetchPurchases();
  }, []);

  if (loading) {
    return (
      <main className="container py-24">
        <p className="text-center text-muted-foreground">Loading purchase history...</p>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>Purchase History - Neon Store</title>
        <meta name="description" content="View your game purchase history and preorders" />
      </Helmet>
      
      <main className="container py-24">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" />Back to Store</Link>
          </Button>
          <h1 className="text-4xl font-bold mb-2">Purchase History</h1>
          <p className="text-muted-foreground">View your game purchases and preorders</p>
        </div>

        {purchases.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
              <p className="text-muted-foreground mb-4">Start exploring our game collection</p>
              <Button asChild>
                <Link to="/">Browse Games</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {purchases.map((purchase) => (
              <Card key={purchase.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-lg capitalize">
                      {purchase.game_slug.replace('-', ' ')}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {purchase.edition} Edition
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={purchase.is_preorder ? "secondary" : "default"}>
                      {purchase.is_preorder ? "Preorder" : "Purchased"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {purchase.order_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {purchase.is_preorder && purchase.preorder_release_date
                        ? `Releases ${format(new Date(purchase.preorder_release_date), 'MMM dd, yyyy')}`
                        : `Purchased ${format(new Date(purchase.created_at), 'MMM dd, yyyy')}`
                      }
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/game/${purchase.game_slug}`}>View Game</Link>
                    </Button>
                    {!purchase.is_preorder && (
                      <Button asChild size="sm">
                        <Link to={`/thank-you?game=${purchase.game_slug}&kind=full`}>
                          Download
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}