import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PauseCircle, PlayCircle, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);
  const [pomodoroRoom, setPomodoroRoom] = useState<any>(null);
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [discordId, setDiscordId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const safeParseDiscordId = (discordId: string): number => {
    try {
      const bigIntId = BigInt(discordId);
      return Number(bigIntId);
    } catch (error) {
      console.error('Error parsing Discord ID:', error);
      return 0;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      console.log('Starting checkAuth...');
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session);
      
      setSession(session);
      
      if (!session) {
        console.log('No session, redirecting to index');
        navigate('/');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('discord_id')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return;
      }

      console.log('Profile data:', profile);

      if (profile?.discord_id) {
        setDiscordId(profile.discord_id);
        console.log('Setting Discord ID:', profile.discord_id);
        
        const { data: room } = await supabase
          .from('pomodoro_rooms')
          .select('*')
          .maybeSingle();

        console.log('Room data:', room);

        if (!room || !room.user_data || !Object.keys(room.user_data).includes(profile.discord_id)) {
          console.log('User not in room, redirecting to index');
          navigate('/');
          return;
        }

        setPomodoroRoom(room);
        const userDataEntries = Object.entries(room.user_data || {});
        const formattedUsers = userDataEntries.map(([id, avatarUrl]) => ({
          id,
          avatar: avatarUrl,
        }));
        setConnectedUsers(formattedUsers);
        
        console.log('Querying stats for Discord ID:', profile.discord_id);
        
        const { data: stats, error: statsError } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', profile.discord_id)
          .maybeSingle();

        if (statsError) {
          console.error('Stats fetch error:', statsError);
          return;
        }

        console.log('Raw stats data:', stats);

        if (stats) {
          console.log('Setting user stats:', stats);
          setUserStats(stats);
        } else {
          console.log('No stats found for discord_id:', profile.discord_id);
        }
      } else {
        console.log('No Discord ID found, redirecting to index');
        navigate('/');
        return;
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!discordId) return;

      console.log('Fetching stats for Discord ID:', discordId);

      const { data: stats, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', discordId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user stats:', error);
        return;
      }

      if (stats) {
        console.log('Periodic stats update:', stats);
        setUserStats(stats);
      } else {
        console.log('No stats found in periodic update for:', discordId);
      }
    };

    fetchUserStats();
    const interval = setInterval(fetchUserStats, 30000);

    return () => clearInterval(interval);
  }, [discordId]);

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

  const calculateSessionTimer = (room: any) => {
    const lastSessionStarted = new Date(room.last_session_started).getTime();
    const currentTime = new Date().getTime();
    const elapsedSeconds = Math.floor((currentTime - lastSessionStarted) / 1000);
    return Math.max(0, room.session_time - elapsedSeconds);
  };

  const checkRoomStatus = async () => {
    if (!session || !discordId) return;

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

    const isUserInRoom = userDataEntries.some(([id]) => id === discordId);
    
    if (!isUserInRoom) {
      setTime(0);
      setIsRunning(false);
      return;
    }

    if (room.is_break) {
      const breakTime = calculateBreakTimer(room);
      setTime(breakTime);
      setIsRunning(breakTime > 0);
      
      if (breakTime === 0) {
        setTimeout(checkRoomStatus, 10000);
      }
    } else {
      const sessionTime = calculateSessionTimer(room);
      setTime(sessionTime);
      setIsRunning(sessionTime > 0);
    }

    console.log('Fetching updated stats for Discord ID:', discordId);
    
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', discordId)
      .maybeSingle();

    if (statsError) {
      console.error('Stats update error:', statsError);
      return;
    }

    if (stats) {
      console.log('Updated user stats:', stats);
      setUserStats(stats);
    } else {
      console.log('No updated stats found for discord_id:', discordId);
    }
  };

  useEffect(() => {
    checkRoomStatus();
    
    const userCheckInterval = setInterval(checkRoomStatus, 30000);
    
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
      clearInterval(userCheckInterval);
    };
  }, [session]);

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
              checkInterval = setInterval(() => {
                checkRoomStatus();
              }, 10000);
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

  const weeklyProgressPercentage = userStats ? 
    ((userStats.weekly_voice_time - userStats.previous_weekly_voice_time) / 
    (userStats.previous_weekly_voice_time || 1)) * 100 : 0;

  const formatHours = (seconds: number) => {
    const hours = seconds / 3600;
    return `${hours.toFixed(1)}h`;
  };

  const chartData = userStats ? [
    { 
      name: 'Previous Week',
      hours: (userStats.previous_weekly_voice_time || 0) / 3600
    },
    { 
      name: 'Current Week',
      hours: (userStats.weekly_voice_time || 0) / 3600
    },
    { 
      name: 'Today',
      hours: (userStats.daily_voice_time || 0) / 3600
    },
    { 
      name: 'Total',
      hours: (userStats.total_voice_time || 0) / 3600
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

  if (!session || !pomodoroRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Not Connected</h2>
          <p className="text-muted-foreground">You need to be in an active room to see this content.</p>
        </Card>
      </div>
    );
  }

  const userInRoom = Object.keys(pomodoroRoom.user_data || {}).includes(discordId || '');
  if (!userInRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Not Connected</h2>
          <p className="text-muted-foreground">You need to be in an active room to see this content.</p>
        </Card>
      </div>
    );
  }

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
