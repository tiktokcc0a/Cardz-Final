import InteractiveBackground from "@/components/interactive-background";

export default function Loading() {
  return (
    <>
      <InteractiveBackground />
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white/80">加载中...</p>
        </div>
      </div>
    </>
  );
}