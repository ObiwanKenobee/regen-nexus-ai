import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Log 404 errors for monitoring (only in dev)
    if (import.meta.env.DEV) {
      console.error(`404 Error: User attempted to access ${location.pathname}`);
    }
  }, [location.pathname]);

  return (
    <>
      <SEOHead 
        title="Page Not Found"
        description="The page you're looking for doesn't exist. Return to RDX Platform homepage."
        noIndex={true}
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="text-center max-w-lg">
          <div className="mb-8">
            <span className="text-8xl font-bold text-primary/20">404</span>
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Page Not Found
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
          
          <div className="mt-12 p-6 bg-muted/50 rounded-lg">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center justify-center gap-2">
              <Search className="w-4 h-4" />
              Looking for something?
            </h2>
            <nav className="flex flex-wrap gap-3 justify-center text-sm" aria-label="Helpful links">
              <Link to="/" className="text-primary hover:underline">
                Dashboard
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/auth" className="text-primary hover:underline">
                Sign In
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/admin" className="text-primary hover:underline">
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
