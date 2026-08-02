/** Shared oval guide overlay for face camera views. */
export function FaceOvalFrame() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div
        className={
          "h-[70%] w-[62%] rounded-[50%] border-2 border-white/80 " +
          "shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
        }
      />
    </div>
  );
}
