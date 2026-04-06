import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const DateTimeFooter = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString("en-PK", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-PK", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  });

  return (
    <footer className="border-t border-border bg-card/80 backdrop-blur py-3 px-4 text-center text-sm text-muted-foreground">
      <div className="flex items-center justify-center gap-2">
        <Clock className="h-4 w-4" />
        <span>{dateStr}</span>
        <span className="text-muted-foreground/50">|</span>
        <span className="font-mono">{timeStr}</span>
      </div>
    </footer>
  );
};

export default DateTimeFooter;
