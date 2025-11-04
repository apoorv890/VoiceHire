import React from 'react';
import { X, Filter as FilterIcon } from 'lucide-react';
import { Button } from './ui/button';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'checkbox' | 'text';
  options?: FilterOption[];
  value?: any;
}

interface FilterPanelProps {
  filters: FilterConfig[];
  onFilterChange: (filterId: string, value: any) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const hasActiveFilters = filters.some(f => {
    if (Array.isArray(f.value)) return f.value.length > 0;
    return f.value !== undefined && f.value !== '' && f.value !== null;
  });

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Filter Panel */}
      <div className="fixed md:absolute right-0 top-0 md:top-full md:mt-2 h-full md:h-auto w-80 md:w-96 bg-white shadow-2xl md:shadow-lg rounded-none md:rounded-xl z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filters.map((filter) => (
            <div key={filter.id} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {filter.label}
              </label>

              {filter.type === 'select' && (
                <select
                  value={filter.value || ''}
                  onChange={(e) => onFilterChange(filter.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">All</option>
                  {filter.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {filter.type === 'multiselect' && (
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {filter.options?.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filter.value?.includes(option.value) || false}
                        onChange={(e) => {
                          const currentValues = filter.value || [];
                          const newValues = e.target.checked
                            ? [...currentValues, option.value]
                            : currentValues.filter((v: string) => v !== option.value);
                          onFilterChange(filter.id, newValues);
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {filter.type === 'checkbox' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filter.value || false}
                    onChange={(e) => onFilterChange(filter.id, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{filter.label}</span>
                </label>
              )}

              {filter.type === 'text' && (
                <input
                  type="text"
                  value={filter.value || ''}
                  onChange={(e) => onFilterChange(filter.id, e.target.value)}
                  placeholder={`Search ${filter.label.toLowerCase()}...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <Button
              onClick={onClearFilters}
              disabled={!hasActiveFilters}
              className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg px-4 py-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear All
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium transition-all"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterPanel;
