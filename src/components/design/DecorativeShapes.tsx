/** Floating primitives in side margins — hidden on mobile; never over the game column. */
export function DecorativeShapes() {
  return (
    <div
      className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block"
      aria-hidden
    >
      <div
        className="absolute left-[6%] top-[18%] h-14 w-14 rotate-12 rounded-full border-2 border-foreground bg-tertiary"
      />
      <div
        className="absolute left-[4%] top-[42%] h-0 w-0 border-l-[20px] border-r-[20px] border-b-[34px] border-l-transparent border-r-transparent border-b-secondary"
      />
      <div
        className="absolute left-[10%] bottom-[22%] h-10 w-10 border-2 border-foreground bg-quaternary"
      />
      <div
        className="absolute right-[8%] top-[24%] h-12 w-20 rounded-full border-2 border-foreground bg-accent"
      />
      <div
        className="absolute right-[5%] top-[48%] h-16 w-16 rotate-45 border-2 border-foreground bg-secondary"
      />
      <div
        className="absolute right-[12%] bottom-[28%] h-3 w-24 rounded-full border-2 border-foreground bg-tertiary"
      />
      <svg
        className="absolute left-[14%] top-[32%] h-8 w-24 text-foreground opacity-80"
        viewBox="0 0 96 24"
        fill="none"
      >
        <path
          d="M2 14 C 18 4, 34 22, 50 10 S 82 18, 94 8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
