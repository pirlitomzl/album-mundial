export function VipButton({ children, className = "", ...props }: any) {
  return (
    <button
      {...props}
      className={`
        px-5 py-3 rounded-full font-semibold
        bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600
        text-black shadow-lg
        hover:scale-105 transition
        active:scale-95
        ${className}
      `}
    >
      {children}
    </button>
  );
}