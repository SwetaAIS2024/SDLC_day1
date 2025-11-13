'use client';

import { Priority, TagResponse, FilterStatus, FilterDueDateRange } from '@/lib/types';
import { Filter, X } from 'lucide-react';

interface FilterPanelProps {
  status: FilterStatus;
  onStatusChange: (status: FilterStatus) => void;
  selectedPriorities: Priority[];
  onPrioritiesChange: (priorities: Priority[]) => void;
  selectedTagIds: number[];
  onTagIdsChange: (tagIds: number[]) => void;
  dueDateRange: FilterDueDateRange;
  onDueDateRangeChange: (range: FilterDueDateRange) => void;
  availableTags: TagResponse[];
  onClearAll: () => void;
  togglePriority: (priority: Priority) => void;
  toggleTag: (tagId: number) => void;
}

export function FilterPanel({
  status,
  onStatusChange,
  selectedPriorities,
  togglePriority,
  selectedTagIds,
  toggleTag,
  dueDateRange,
  onDueDateRangeChange,
  availableTags,
  onClearAll,
}: FilterPanelProps) {
  const hasActiveFilters = 
    status !== 'all' ||
    selectedPriorities.length > 0 ||
    selectedTagIds.length > 0 ||
    dueDateRange !== 'all';

  const priorityOptions: Priority[] = ['high', 'medium', 'low'];
  const priorityColors = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-blue-400',
  };

  const dueDateOptions: { value: FilterDueDateRange; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'today', label: 'Today' },
    { value: 'this-week', label: 'This Week' },
    { value: 'this-month', label: 'This Month' },
    { value: 'no-due-date', label: 'No Due Date' },
  ];

  return (
    <div className="border border-gray-700 rounded-lg p-4 bg-gray-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Status</label>
        <div className="space-y-2">
          {(['all', 'incomplete', 'completed'] as FilterStatus[]).map((statusOption) => (
            <label key={statusOption} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="radio"
                name="status"
                value={statusOption}
                checked={status === statusOption}
                onChange={() => onStatusChange(statusOption)}
                className="w-4 h-4 border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
              />
              <span className="capitalize">{statusOption}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Priority Filter */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Priority</label>
        <div className="space-y-2">
          {priorityOptions.map((priority) => (
            <label key={priority} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedPriorities.includes(priority)}
                onChange={() => togglePriority(priority)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
              />
              <span className={`capitalize ${priorityColors[priority]}`}>{priority}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tag Filter */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Tags</label>
        {availableTags.length === 0 ? (
          <p className="text-sm text-gray-400">No tags available. Create tags to filter by them.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  selectedTagIds.includes(tag.id)
                    ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-800'
                    : ''
                }`}
                style={{
                  backgroundColor: tag.color,
                  color: '#fff',
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Due Date Range Filter */}
      <div className="space-y-2">
        <label htmlFor="due-date-range" className="block text-sm font-medium text-gray-300">
          Due Date
        </label>
        <select
          id="due-date-range"
          value={dueDateRange}
          onChange={(e) => onDueDateRangeChange(e.target.value as FilterDueDateRange)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {dueDateOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
