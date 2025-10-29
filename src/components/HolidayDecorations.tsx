import { useSiteTheme } from "@/hooks/useSiteTheme";

export default function HolidayDecorations() {
  const { activeTheme } = useSiteTheme();

  if (!activeTheme) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {activeTheme.slug === "christmas" && <ChristmasDecorations />}
      {activeTheme.slug === "halloween" && <HalloweenDecorations />}
      {activeTheme.slug === "valentines" && <ValentinesDecorations />}
      {activeTheme.slug === "new-year" && <NewYearDecorations />}
      {activeTheme.slug === "pride" && <PrideDecorations />}
    </div>
  );
}

function ChristmasDecorations() {
  return (
    <>
      {/* Santa flying across screen */}
      <div 
        className="absolute text-6xl"
        style={{ 
          animation: "santa-fly 30s linear infinite",
          animationDelay: "0s"
        }}
      >
        🎅🛷
      </div>
      
      {/* Snowflakes */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute text-2xl opacity-70"
          style={{
            left: `${Math.random() * 100}%`,
            animation: `fall-snow ${5 + Math.random() * 10}s linear infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        >
          ❄️
        </div>
      ))}
      
      {/* Twinkling stars */}
      {[...Array(15)].map((_, i) => (
        <div
          key={`star-${i}`}
          className="absolute text-xl"
          style={{
            top: `${Math.random() * 40}%`,
            left: `${Math.random() * 100}%`,
            animation: `twinkle ${1 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        >
          ⭐
        </div>
      ))}
    </>
  );
}

function HalloweenDecorations() {
  return (
    <>
      {/* Floating ghosts */}
      {[...Array(5)].map((_, i) => (
        <div
          key={`ghost-${i}`}
          className="absolute text-5xl"
          style={{
            top: `${20 + Math.random() * 60}%`,
            left: `${Math.random() * 90}%`,
            animation: `float-ghost ${3 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        >
          👻
        </div>
      ))}
      
      {/* Bouncing pumpkins */}
      {[...Array(4)].map((_, i) => (
        <div
          key={`pumpkin-${i}`}
          className="absolute text-4xl bottom-0"
          style={{
            left: `${10 + i * 25}%`,
            animation: `bounce-pumpkin ${2 + Math.random()}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        >
          🎃
        </div>
      ))}
      
      {/* Bats flying */}
      {[...Array(6)].map((_, i) => (
        <div
          key={`bat-${i}`}
          className="absolute text-3xl"
          style={{
            top: `${Math.random() * 30}%`,
            left: `${Math.random() * 100}%`,
            animation: `float-ghost ${2 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        >
          🦇
        </div>
      ))}
    </>
  );
}

function ValentinesDecorations() {
  return (
    <>
      {/* Floating hearts */}
      {[...Array(15)].map((_, i) => (
        <div
          key={`heart-${i}`}
          className="absolute text-3xl"
          style={{
            bottom: "-50px",
            left: `${Math.random() * 100}%`,
            animation: `fall-snow ${8 + Math.random() * 5}s linear infinite reverse`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        >
          {Math.random() > 0.5 ? "💖" : "💕"}
        </div>
      ))}
      
      {/* Twinkling hearts */}
      {[...Array(10)].map((_, i) => (
        <div
          key={`twinkle-heart-${i}`}
          className="absolute text-2xl"
          style={{
            top: `${Math.random() * 80}%`,
            left: `${Math.random() * 100}%`,
            animation: `twinkle ${1.5 + Math.random()}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        >
          💝
        </div>
      ))}
    </>
  );
}

function NewYearDecorations() {
  return (
    <>
      {/* Fireworks */}
      {[...Array(10)].map((_, i) => (
        <div
          key={`firework-${i}`}
          className="absolute text-4xl"
          style={{
            top: `${Math.random() * 60}%`,
            left: `${Math.random() * 100}%`,
            animation: `twinkle ${1 + Math.random()}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        >
          {["🎆", "🎇", "✨"][Math.floor(Math.random() * 3)]}
        </div>
      ))}
      
      {/* Champagne bubbles rising */}
      {[...Array(12)].map((_, i) => (
        <div
          key={`bubble-${i}`}
          className="absolute text-2xl"
          style={{
            bottom: "-30px",
            left: `${Math.random() * 100}%`,
            animation: `fall-snow ${5 + Math.random() * 5}s linear infinite reverse`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        >
          🥂
        </div>
      ))}
    </>
  );
}

function PrideDecorations() {
  return (
    <>
      {/* Rainbow elements */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`rainbow-${i}`}
          className="absolute text-5xl"
          style={{
            top: `${10 + Math.random() * 70}%`,
            left: `${Math.random() * 100}%`,
            animation: `float-ghost ${3 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        >
          🏳️‍🌈
        </div>
      ))}
      
      {/* Sparkling stars */}
      {[...Array(20)].map((_, i) => (
        <div
          key={`star-${i}`}
          className="absolute text-2xl"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `twinkle ${1 + Math.random() * 1.5}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        >
          ✨
        </div>
      ))}
    </>
  );
}
