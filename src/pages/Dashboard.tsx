
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PauseCircle, PlayCircle, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [time, setTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserStats = async () => {
      const { data: stats, error } = await supabase
        .from('user_stats')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching user stats:', error);
        return;
      }

      if (stats) {
        setUserStats(stats);
      }
    };

    fetchUserStats();
  }, []);

  // Calculate weekly progress percentage
  const weeklyProgressPercentage = userStats ? 
    ((userStats.weekly_voice_time - userStats.previous_weekly_voice_time) / 
    (userStats.previous_weekly_voice_time || 1)) * 100 : 0;

  // Convert minutes to hours for display
  const formatHours = (minutes: number) => {
    return `${(minutes / 60).toFixed(1)}h`;
  };

  // Mock data for the area chart (you would replace this with real daily data)
  const chartData = [
    { day: 'Mon', hours: userStats?.daily_voice_time || 0 },
    { day: 'Tue', hours: (userStats?.daily_voice_time || 0) * 0.8 },
    { day: 'Wed', hours: (userStats?.daily_voice_time || 0) * 1.2 },
    { day: 'Thu', hours: (userStats?.daily_voice_time || 0) * 0.9 },
    { day: 'Fri', hours: (userStats?.daily_voice_time || 0) * 1.1 },
    { day: 'Sat', hours: (userStats?.daily_voice_time || 0) * 0.7 },
    { day: 'Sun', hours: userStats?.daily_voice_time || 0 },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      toast({
        title: "Time's up!",
        description: "Great job! Take a break.",
      });
      setIsRunning(false);
    }

    return () => clearInterval(interval);
  }, [isRunning, time, toast]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setTime(25 * 60);
    setIsRunning(false);
  };

  const progress = ((25 * 60 - time) / (25 * 60)) * 283;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8 glass-card animate-in">
              <div className="text-center space-y-6">
                <div className="relative w-64 h-64 mx-auto">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted/20"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      r="45"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="timer-ring text-primary"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      r="45"
                      cx="50"
                      cy="50"
                      style={{
                        strokeDashoffset: 283 - progress,
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-semibold">{formatTime(time)}</span>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={toggleTimer}
                  >
                    {isRunning ? (
                      <PauseCircle className="h-6 w-6" />
                    ) : (
                      <PlayCircle className="h-6 w-6" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={resetTimer}
                  >
                    <RotateCcw className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-8 glass-card animate-in">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Study Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Today</p>
                    <p className="text-2xl font-semibold">
                      {formatHours(userStats?.daily_voice_time || 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-2xl font-semibold">
                      {formatHours(userStats?.weekly_voice_time || 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Time</p>
                    <p className="text-2xl font-semibold">
                      {formatHours(userStats?.total_voice_time || 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Weekly Progress</p>
                    <p className={`text-2xl font-semibold ${weeklyProgressPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {weeklyProgressPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6 glass-card animate-in">
            <h3 className="text-lg font-semibold mb-4">Weekly Overview</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorHours)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Connected Users
            </p>
            <div className="flex justify-center -space-x-2 overflow-hidden py-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-background"
                  style={{
                    backgroundImage: `url(https://api.dicebear.com/7.x/avataaars/svg?seed=${i})`,
                    backgroundSize: "cover",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
