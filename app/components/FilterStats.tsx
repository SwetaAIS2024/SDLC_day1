'use client';

interface FilterStatsProps {
  totalTodos: number;
  filteredTodos: number;
}

export function FilterStats({ totalTodos, filteredTodos }: FilterStatsProps) {
  if (totalTodos === filteredTodos) return null;

  return (
    <div className="text-sm text-gray-400 mb-2">
      Showing <span className="font-semibold text-white">{filteredTodos}</span> of{' '}
      <span className="font-semibold text-white">{totalTodos}</span> todos
    </div>
  );
}
