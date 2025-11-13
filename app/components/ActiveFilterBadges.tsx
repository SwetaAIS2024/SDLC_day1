'use client';

import { X } from 'lucide-react';
import { Priority, TagResponse, FilterStatus, FilterDueDateRange } from '@/lib/types';

interface ActiveFilterBadgesProps {
  status: FilterStatus;
  onRemoveStatus: () => void;
  selectedPriorities: Priority[];
  onRemovePriority: (priority: Priority) => void;
  selectedTags: TagResponse[];
  onRemoveTag: (tagId: number) => void;
  dueDateRange: FilterDueDateRange;
  onRemoveDueDateRange: () => void;
  searchTerm: string;
  onRemoveSearch: () => void;
}

export function ActiveFilterBadges({
  status,
  onRemoveStatus,
  selectedPriorities,
  onRemovePriority,
  selectedTags,
  onRemoveTag,
  dueDateRange,
  onRemoveDueDateRange,
  searchTerm,
  onRemoveSearch,
}: ActiveFilterBadgesProps) {
  const hasActiveFilters =
    searchTerm ||
    status !== 'all' ||
    selectedPriorities.length > 0 ||
    selectedTags.length > 0 ||
    dueDateRange !== 'all';

  if (!hasActiveFilters) return null;

  const dueDateLabels: Record<FilterDueDateRange, string> = {
    'all': 'All',
    'overdue': 'Overdue',
    'today': 'Today',
    'this-week': 'This Week',
    'this-month': 'This Month',
    'no-due-date': 'No Due Date',
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {searchTerm && (
        <FilterBadge
          label={`Search: "${searchTerm}"`}
          onRemove={onRemoveSearch}
          color="bg-purple-600"
        />
      )}

      {status !== 'all' && (
        <FilterBadge
          label={`Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`}
          onRemove={onRemoveStatus}
          color="bg-green-600"
        />
      )}

      {selectedPriorities.map((priority) => (
        <FilterBadge
          key={priority}
          label={`Priority: ${priority.charAt(0).toUpperCase() + priority.slice(1)}`}
          onRemove={() => onRemovePriority(priority)}
          color={
            priority === 'high' ? 'bg-red-600' :
            priority === 'medium' ? 'bg-yellow-600' :
            'bg-blue-600'
          }
        />
      ))}

      {selectedTags.map((tag) => (
        <FilterBadge
          key={tag.id}
          label={tag.name}
          onRemove={() => onRemoveTag(tag.id)}
          color={`bg-[${tag.color}]`}
          style={{ backgroundColor: tag.color }}
        />
      ))}

      {dueDateRange !== 'all' && (
        <FilterBadge
          label={`Due: ${dueDateLabels[dueDateRange]}`}
          onRemove={onRemoveDueDateRange}
          color="bg-indigo-600"
        />
      )}
    </div>
  );
}

function FilterBadge({
  label,
  onRemove,
  color,
  style,
}: {
  label: string;
  onRemove: () => void;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white ${color || 'bg-gray-600'}`}
      style={style}
    >
      {label}
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X size={14} />
      </button>
    </span>
  );
}
