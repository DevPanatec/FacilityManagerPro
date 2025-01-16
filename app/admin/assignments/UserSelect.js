export default function UserSelect({ users, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Usuario
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Seleccionar usuario</option>
        {users.map((user) => (
          <option key={user.user_id} value={user.user_id}>
            {user.first_name} {user.last_name}
          </option>
        ))}
      </select>
    </div>
  );
} 