import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        navigate("/", { replace: true });
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) navigate("/", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in");
  };

  const handleSignup = async () => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Check your email to confirm your account");
  };

  return (
    <>
      <Helmet>
        <title>{mode === "signin" ? "Sign In" : "Create Account"} | Neon Game Store</title>
        <meta name="description" content="Sign in or create an account to manage purchases and claim demos." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/'} />
      </Helmet>

      <main className="container py-12 max-w-lg">
        <h1 className="sr-only">{mode === "signin" ? "Sign In" : "Create Account"}</h1>
        <Card>
          <CardHeader>
            <CardTitle>{mode === "signin" ? "Welcome back" : "Create your account"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button variant="hero" className="w-full" disabled={loading} onClick={mode === "signin" ? handleSignin : handleSignup}>
              {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
            </Button>
            <Separator />
            <div className="text-sm text-muted-foreground">
              {mode === "signin" ? (
                <span>
                  Don’t have an account?{" "}
                  <button className="story-link" onClick={() => setMode("signup")}>Sign up</button>
                </span>
              ) : (
                <span>
                  Already have an account?{" "}
                  <button className="story-link" onClick={() => setMode("signin")}>Sign in</button>
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Trouble signing in? Ensure your Site URL and Redirect URLs are configured in Supabase Auth settings.
            </div>
            <div className="flex gap-3">
              <Button asChild variant="secondary" size="sm"><Link to="/">Back</Link></Button>
              <Button asChild variant="secondary" size="sm"><a href="https://supabase.com/dashboard/project/gyorpfibmjromzopnmkc/auth/providers" target="_blank" rel="noreferrer">Auth Settings</a></Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default Auth;
