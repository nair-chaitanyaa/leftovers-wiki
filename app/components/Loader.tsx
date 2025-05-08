export default function Loader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" />
      </div>
    </div>
  );
} 