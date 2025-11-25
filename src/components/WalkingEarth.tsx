import { motion } from "framer-motion";

const WalkingEarth = () => {
  return (
    <motion.div
      className="relative w-full max-w-md mx-auto"
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg
        viewBox="0 0 450 400"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Earth Body */}
        <motion.circle
          cx="200"
          cy="180"
          r="100"
          fill="#4CAF50"
          stroke="#000"
          strokeWidth="4"
        />
        
        {/* Continents */}
        <path
          d="M 150 160 Q 160 150 170 155 L 180 150 Q 190 155 185 165 L 175 170 Z"
          fill="#2E7D32"
          stroke="#000"
          strokeWidth="2"
        />
        <path
          d="M 210 165 Q 220 160 230 168 L 235 175 Q 230 182 220 180 L 215 175 Z"
          fill="#2E7D32"
          stroke="#000"
          strokeWidth="2"
        />
        
        {/* Arms */}
        <motion.g
          animate={{
            rotate: [-5, 5, -5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "140px 180px" }}
        >
          <path
            d="M 140 180 Q 120 190 100 185"
            stroke="#000"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="95" cy="185" r="8" fill="#000" />
        </motion.g>
        
        {/* Right arm holding sign */}
        <motion.g
          animate={{
            rotate: [5, -5, 5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "260px 180px" }}
        >
          <path
            d="M 260 180 Q 280 170 300 160"
            stroke="#000"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="300" cy="155" r="8" fill="#000" />
        </motion.g>
        
        {/* Sign saying "NO MORE GREED" */}
        <motion.g
          animate={{
            rotate: [-3, 3, -3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "350px 100px" }}
        >
          {/* Sign board */}
          <rect 
            x="280" 
            y="60" 
            width="140" 
            height="70" 
            fill="#FFD900" 
            stroke="#000" 
            strokeWidth="4"
          />
          <text 
            x="350" 
            y="90" 
            textAnchor="middle" 
            fontSize="18" 
            fontWeight="900" 
            fill="#000"
          >
            NO MORE
          </text>
          <text 
            x="350" 
            y="115" 
            textAnchor="middle" 
            fontSize="18" 
            fontWeight="900" 
            fill="#000"
          >
            GREED
          </text>
          {/* Sign pole */}
          <line 
            x1="350" 
            y1="130" 
            x2="305" 
            y2="160" 
            stroke="#000" 
            strokeWidth="4" 
          />
        </motion.g>
        
        {/* Legs */}
        <motion.g
          animate={{
            rotate: [-3, 3, -3],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "180px 280px" }}
        >
          <path
            d="M 180 280 L 170 320"
            stroke="#000"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <ellipse cx="170" cy="325" rx="12" ry="8" fill="#000" />
        </motion.g>
        
        <motion.g
          animate={{
            rotate: [3, -3, 3],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "220px 280px" }}
        >
          <path
            d="M 220 280 L 230 320"
            stroke="#000"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <ellipse cx="230" cy="325" rx="12" ry="8" fill="#000" />
        </motion.g>
        
        {/* Eyes */}
        <circle cx="180" cy="170" r="8" fill="#000" />
        <circle cx="220" cy="170" r="8" fill="#000" />
        <circle cx="183" cy="168" r="3" fill="#FFF" />
        <circle cx="223" cy="168" r="3" fill="#FFF" />
        
        {/* Smile */}
        <path
          d="M 180 190 Q 200 200 220 190"
          stroke="#000"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
};

export default WalkingEarth;
