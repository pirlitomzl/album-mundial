export default function VipStickerCard({
  sticker,
  cantidad,
  onClick,
}: any) {
  const tiene = cantidad > 0;

  return (
    <div
      onClick={onClick}
      className="
        relative
        cursor-pointer
        rounded-3xl
        overflow-hidden
        border border-white/10
        bg-white/10
        backdrop-blur-xl
        hover:scale-105
        transition-all
        duration-300
        shadow-xl
        p-4
      "
    >

      {/* STATUS */}
      <div
        className={`
          absolute top-3 right-3 w-4 h-4 rounded-full
          ${tiene ? "bg-green-400" : "bg-red-500"}
        `}
      />

      {/* NÚMERO */}
      <p className="text-2xl font-bold text-yellow-400 mb-1">
        {sticker.numero}
      </p>

      {/* NOMBRE */}
      <p className="font-medium text-white">
        {sticker.nombre}
      </p>

      {/* PAÍS */}
      <p className="text-xs text-gray-400 mt-1">
        {sticker.pais}
      </p>

      {/* CANTIDAD */}
      <div className="mt-4">

        <div className="
          bg-black/30
          border border-white/10
          rounded-xl
          px-3 py-2
          text-sm
          inline-block
        ">
          x{cantidad}
        </div>

      </div>

    </div>
  );
}