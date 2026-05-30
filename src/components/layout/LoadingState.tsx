export default function LoadingState() {
  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-slate-500">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="font-medium animate-pulse">Loading data...</p>
      </div>
    </div>
  );
}
