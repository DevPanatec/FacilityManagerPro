export default function DurationButtons({ duration, onChange }) {
  const durations = [1, 2, 4, 8];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Duración
      </label>
      <div className="grid grid-cols-4 gap-2">
        {durations.map((hours) => (
          <button
            key={hours}
            type="button"
            onClick={() => onChange(hours)}
            className={`
              py-2 px-4 text-sm font-medium rounded-lg
              ${duration === hours
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
              transition-colors
            `}
          >
            {hours}h
          </button>
        ))}
      </div>
    </div>
  );
} 