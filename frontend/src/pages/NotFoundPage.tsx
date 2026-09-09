import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UtensilsCrossed, 
  Home, 
  ArrowLeft, 
  Compass, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { Button, Card } from '../design-system';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-radial from-primary/10 via-background to-background text-foreground flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden select-none">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-5000" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-7000" />

      {/* Main Container */}
      <div className="w-full max-w-lg text-center space-y-8 relative z-10 animate-fade-in">
        
        {/* Brand Logo Header */}
        <Link to="/" className="inline-flex items-center gap-2 group cursor-pointer">
          <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
            <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent group-hover:text-primary transition-colors">
            BiteSpeed
          </span>
        </Link>

        {/* 404 Hero Card */}
        <Card className="backdrop-blur-md bg-card/85 border border-border/50 shadow-2xl rounded-3xl p-8 space-y-6">
          
          {/* Big 404 Graphic */}
          <div className="relative inline-flex items-center justify-center">
            <span className="text-8xl md:text-9xl font-black tracking-tighter bg-gradient-to-b from-primary via-rose-500 to-primary/20 bg-clip-text text-transparent select-none opacity-90">
              404
            </span>
            
            {/* Center Floating Icon Badge */}
            <div className="absolute -bottom-2 bg-card border border-border/60 shadow-lg rounded-2xl p-3 flex items-center justify-center text-primary animate-bounce">
              <Compass className="h-8 w-8 text-primary" />
            </div>
          </div>

          {/* Heading and Subtext */}
          <div className="space-y-2 pt-2">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
              Dish Not Found!
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium leading-relaxed max-w-sm mx-auto">
              Looks like the page you are looking for has been moved, eaten, or doesn't exist on our menu.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto text-xs font-bold gap-2 rounded-xl"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>

            <Link to="/" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                className="w-full text-xs font-extrabold gap-2 shadow-md shadow-primary/20 rounded-xl"
              >
                <Home className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Quick Links */}
          <div className="pt-6 border-t border-border/20 grid grid-cols-2 gap-3 text-left">
            <Link
              to="/restaurants"
              className="p-3 rounded-2xl border border-border/30 bg-muted/20 hover:bg-muted/50 transition-colors flex items-center gap-3 group"
            >
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Browse Food</p>
                <p className="text-[10px] text-muted-foreground">Find local eateries</p>
              </div>
            </Link>

            <Link
              to="/login"
              className="p-3 rounded-2xl border border-border/30 bg-muted/20 hover:bg-muted/50 transition-colors flex items-center gap-3 group"
            >
              <div className="h-8 w-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0 group-hover:scale-110 transition-transform">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Account</p>
                <p className="text-[10px] text-muted-foreground">Sign in or register</p>
              </div>
            </Link>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-xs text-muted-foreground font-medium">
          &copy; {new Date().getFullYear()} BiteSpeed Online Food Delivery. All rights reserved.
        </p>
      </div>
    </div>
  );
}
