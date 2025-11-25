import { useState, useEffect } from "react";

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Set launch date to 30 days from now
    const launchDate = new Date();
    launchDate.setDate(launchDate.getDate() + 30);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate.getTime() - now;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-foreground text-background w-24 h-24 md:w-32 md:h-32 flex items-center justify-center border-4 border-foreground shadow-[6px_6px_0px_0px_#000000]">
        <span className="text-4xl md:text-6xl font-black">{value.toString().padStart(2, '0')}</span>
      </div>
      <span className="text-sm md:text-base font-black mt-2 uppercase">{label}</span>
    </div>
  );

  return (
    <div className="flex gap-3 md:gap-6">
      <TimeBlock value={timeLeft.days} label="DAYS" />
      <TimeBlock value={timeLeft.hours} label="HRS" />
      <TimeBlock value={timeLeft.minutes} label="MIN" />
      <TimeBlock value={timeLeft.seconds} label="SEC" />
    </div>
  );
};

export default CountdownTimer;
