interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "blue" | "green" | "red" | "none";
  onClick?: () => void;
}

export function Card({
  children,
  className = "",
  glow = "none",
  onClick,
}: CardProps) {
  const glowClass = {
    blue: "hover:neon-glow",
    green: "hover:neon-glow-green",
    red: "hover:neon-glow-red",
    none: "",
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-border bg-surface p-6 transition-all duration-300 hover:border-neon-blue/30 ${glowClass[glow]} ${className}`}
    >
      {children}
    </div>
  );
}
