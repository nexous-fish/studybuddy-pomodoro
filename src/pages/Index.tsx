
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already authenticated and in a room
  useEffect(() => {
    const checkAuthAndRoom = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Get the user's Discord ID from their profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('discord_id')
          .eq('id', session.user.id)
          .single();

        if (profile?.discord_id) {
          // Check if user is in an active room
          const { data: room } = await supabase
            .from('pomodoro_rooms')
            .select('user_data')
            .maybeSingle();

          if (room && room.user_data && Object.keys(room.user_data).includes(profile.discord_id)) {
            // User is in an active room, redirect to dashboard
            navigate('/dashboard');
          }
        }
      }
    };

    checkAuthAndRoom();
  }, [navigate]);

  const signInWithDiscord = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        scopes: 'identify email',
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('Error signing in with Discord:', error.message);
      
      // Show a user-friendly error message
      if (error.message?.includes('rate limit') || error.message?.includes('Unable to exchange external code')) {
        toast({
          title: "Too many login attempts",
          description: "Please wait a few minutes before trying again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Authentication error",
          description: "There was a problem signing in with Discord. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

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
              onClick={signInWithDiscord}
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
