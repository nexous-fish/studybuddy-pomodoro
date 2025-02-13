import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PauseCircle, PlayCircle, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);
  const [pomodoroRoom, setPomodoroRoom] = useState<any>(null);
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);
  const { toast } = useToast();

  // Fetch pomodoro room data and initialize timer
  useEffect(() => {
    const fetchPomodoroRoom = async () => {
      const { data: room, error } = await supabase
        .from('pomodoro_rooms')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching pomodoro room:', error);
        return;
      }

      if (room) {
        setPomodoroRoom(room);
        // Extract connected users from user_data
        const users = Object.values(room.user_data || {});
        setConnectedUsers(users);
        
        // Calculate remaining time based on last_session_started
        const lastSessionStarted = new Date(room.last_session_started).getTime();
        const currentTime = new Date().getTime();
        const elapsedSeconds = Math.floor((currentTime - lastSessionStarted) / 1000);
        
        if (room.is_break) {
          // For break time, just use the break_time value
          setTime(room.break_time);
        } else {
          // For regular session, calculate remaining time
          const remainingTime = Math.max(0, room.session_time - elapsedSeconds);
          setTime(remainingTime);
        }
        
        // Only start running if there's time remaining
        setIsRunning(true);
      }
    };

    fetchPomodoroRoom();
    
    // Set up real-time subscription for pomodoro room updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pomodoro_rooms'
        },
        (payload) => {
          console.log('Pomodoro room updated:', payload);
          fetchPomodoroRoom(); // Refetch room data when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Sync timer with server
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (pomodoroRoom && isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime === 0) {
            toast({
              title: pomodoroRoom.is_break ? "Break time's up!" : "Time's up!",
              description: pomodoroRoom.is_break ? "Time to focus!" : "Take a break!",
            });
            setIsRunning(false);
          }
          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, time, toast, pomodoroRoom]);

  useEffect(() => {
    const fetchUserStats = async () => {
      const { data: stats, error } = await supabase
        .from('user_stats')
        .select('*')
        .maybeSingle();

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

  // Convert seconds to hours for display
  const formatHours = (seconds: number) => {
    const hours = seconds / 3600; // Convert seconds to hours
    return `${hours.toFixed(1)}h`;
  };

  // Convert daily voice time from seconds to hours for the chart
  const chartData = [
    { day: 'Mon', hours: (userStats?.daily_voice_time || 0) / 3600 },
    { day: 'Tue', hours: ((userStats?.daily_voice_time || 0) * 0.8) / 3600 },
    { day: 'Wed', hours: ((userStats?.daily_voice_time || 0) * 1.2) / 3600 },
    { day: 'Thu', hours: ((userStats?.daily_voice_time || 0) * 0.9) / 3600 },
    { day: 'Fri', hours: ((userStats?.daily_voice_time || 0) * 1.1) / 3600 },
    { day: 'Sat', hours: ((userStats?.daily_voice_time || 0) * 0.7) / 3600 },
    { day: 'Sun', hours: (userStats?.daily_voice_time || 0) / 3600 },
  ];

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    if (!pomodoroRoom) return;
    
    const sessionLength = pomodoroRoom.is_break ? 
      pomodoroRoom.break_time : 
      pomodoroRoom.session_time;
    setTime(sessionLength);
    setIsRunning(false);
  };

  const progress = pomodoroRoom ? 
    ((pomodoroRoom.is_break ? pomodoroRoom.break_time : pomodoroRoom.session_time) - time) / 
    (pomodoroRoom.is_break ? pomodoroRoom.break_time : pomodoroRoom.session_time) * 283 : 
    0;

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
              {connectedUsers.map((user: any, i: number) => (
                <div
                  key={i}
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-background"
                  style={{
                    backgroundImage: `url(${user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`})`,
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
