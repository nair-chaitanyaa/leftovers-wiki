interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function InputBox({ 
  value, 
  onChange, 
  placeholder = "Enter your leftovers/ingredients here!" 
}: InputBoxProps) {
  return (
    <div className="w-full">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-32 px-4 py-3 rounded-lg bg-gray-50 border-2 border-indigo-600 
                 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                 placeholder-gray-400 text-gray-900 resize-none font-sans
                 transition-colors duration-200"
      />
      <div className="mt-2 text-sm text-black">
        Tip: For best results, include quantities (e.g. 1 cup rice).
      </div>
    </div>
  );
} 
