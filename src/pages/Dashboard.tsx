
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PauseCircle, PlayCircle, RotateCcw } from "lucide-react";

const Dashboard = () => {
  const [time, setTime] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

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

  const progress = ((25 * 60 - time) / (25 * 60)) * 283; // 283 is the circumference of the circle

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8">
        <div className="max-w-md mx-auto space-y-8">
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
