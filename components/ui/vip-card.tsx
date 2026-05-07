export function VipCard({ children, className = "" }: any) {
  return (
    <div
      className={`
        bg-white/10 backdrop-blur-xl
        border border-white/20
        rounded-2xl
        shadow-lg
        hover:scale-[1.02] transition
        ${className}
      `}
    >
      {children}
    </div>
  );
}