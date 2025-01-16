export function DurationButtons({ duration, onSelect }) {
  const durations = [
    { value: "4", label: "4 horas" },
    { value: "8", label: "8 horas" },
    { value: "12", label: "12 horas" }
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Duración
      </label>
      <div className="grid grid-cols-3 gap-2">
        {durations.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`
              py-2 px-4 rounded-lg text-sm font-medium transition-colors
              ${duration === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
} 