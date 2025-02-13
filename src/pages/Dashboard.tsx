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

  // Calculate break timer
  const calculateBreakTimer = (room: any) => {
    const lastSessionStarted = new Date(room.last_session_started).getTime();
    const currentTime = new Date().getTime();
    const sessionEndTime = lastSessionStarted + (room.session_time * 1000);
    const breakEndTime = sessionEndTime + (room.break_time * 1000);
    
    if (currentTime >= breakEndTime) {
      return 0;
    }
    
    const remainingBreakTime = Math.ceil((breakEndTime - currentTime) / 1000);
    return Math.max(0, Math.min(remainingBreakTime, room.break_time));
  };

  // Calculate session timer
  const calculateSessionTimer = (room: any) => {
    const lastSessionStarted = new Date(room.last_session_started).getTime();
    const currentTime = new Date().getTime();
    const elapsedSeconds = Math.floor((currentTime - lastSessionStarted) / 1000);
    return Math.max(0, room.session_time - elapsedSeconds);
  };

  // Check room status periodically
  const checkRoomStatus = async () => {
    const { data: room, error } = await supabase
      .from('pomodoro_rooms')
      .select('*')
      .maybeSingle();

    if (error || !room) return;

    setPomodoroRoom(room);
    const userDataEntries = Object.entries(room.user_data || {});
    const formattedUsers = userDataEntries.map(([id, avatarUrl]) => ({
      id,
      avatar: avatarUrl,
    }));
    setConnectedUsers(formattedUsers);

    if (room.is_break) {
      const breakTime = calculateBreakTimer(room);
      setTime(breakTime);
      setIsRunning(breakTime > 0);
    } else {
      const sessionTime = calculateSessionTimer(room);
      setTime(sessionTime);
      setIsRunning(sessionTime > 0);
    }
  };

  // Initialize and handle real-time updates
  useEffect(() => {
    checkRoomStatus();
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pomodoro_rooms'
        },
        () => checkRoomStatus()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Timer effect with auto-refresh
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let checkInterval: NodeJS.Timeout;

    if (pomodoroRoom && isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime === 0) {
            if (pomodoroRoom.is_break) {
              toast({
                title: "Break time's up!",
                description: "Time to focus!",
              });
              // Set up periodic check for new session
              checkInterval = setInterval(() => {
                checkRoomStatus();
              }, 10000); // Check every 10 seconds
            } else {
              toast({
                title: "Session complete!",
                description: "Time for a break!",
              });
              const breakTime = calculateBreakTimer(pomodoroRoom);
              if (breakTime > 0) {
                setTime(breakTime);
                return breakTime;
              }
            }
            setIsRunning(false);
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      clearInterval(interval);
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [isRunning, time, toast, pomodoroRoom]);

  // Fetch user stats
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
  const chartData = userStats ? [
    { 
      name: 'Previous Week',
      hours: userStats.previous_weekly_voice_time / 3600
    },
    { 
      name: 'Current Week',
      hours: userStats.weekly_voice_time / 3600
    },
    { 
      name: 'Today',
      hours: userStats.daily_voice_time / 3600
    },
    { 
      name: 'Total',
      hours: userStats.total_voice_time / 3600
    }
  ] : [];

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    if (!pomodoroRoom) return;
    if (pomodoroRoom.is_break) {
      setTime(calculateBreakTimer(pomodoroRoom));
    } else {
      setTime(calculateSessionTimer(pomodoroRoom));
    }
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
                        strokeDasharray: "283",
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
                  <XAxis dataKey="name" className="text-xs" />
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
            <div className="flex justify-center -space-x-2 overflow-hidden py-4 flex-wrap">
              {connectedUsers.map((user: any) => (
                <div
                  key={user.id}
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-background"
                  style={{
                    backgroundImage: `url(${user.avatar})`,
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
