import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>404 Not Found | Neon Game Store</title>
        <meta name="description" content="The page you are looking for does not exist." />
      </Helmet>
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-5xl mb-3">404</h1>
          <p className="text-lg text-muted-foreground mb-6">Oops! Page not found</p>
          <a href="/">
            <Button variant="hero">Return to Home</Button>
          </a>
        </div>
      </main>
    </>
  );
};

export default NotFound;
