
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20">
      <div className="container max-w-[800px] px-4 animate-in">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl/tight">
              Focus Together, 
              <span className="text-primary">Achieve More</span>
            </h1>
            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
              Join a community of focused learners. Track your progress, stay motivated, and reach your goals together.
            </p>
          </div>
          <div className="mx-auto max-w-sm space-y-4">
            <Button
              size="lg"
              className="w-full group relative overflow-hidden bg-primary hover:bg-primary/90 transition-all duration-300"
              onClick={() => navigate("/dashboard")}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Connect with Discord
                <ChevronRight className="h-4 w-4" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/25 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            </Button>
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-4 right-4">
        <div className="glass-card rounded-full px-4 py-2 text-sm text-muted-foreground">
          <span className="animate-pulse inline-block h-2 w-2 rounded-full bg-primary mr-2" />
          <span>{Math.floor(Math.random() * 500) + 1000} students focusing right now</span>
        </div>
      </div>
    </div>
  );
};

export default Index;
