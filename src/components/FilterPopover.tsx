import React from "react";
import { Check } from "lucide-react";
import { Period, Filters } from "../types";

interface FilterPopoverProps {
  filters: Filters;
  onChangeFilters: (newFilters: Filters) => void;
  onClose: () => void;
}

export default function FilterPopover({ filters, onChangeFilters, onClose }: FilterPopoverProps) {
  const periods = Object.values(Period);

  const handleSelectPeriod = (p: Period) => {
    onChangeFilters({ ...filters, period: p });
    onClose();
  };

  return (
    <div className="absolute right-4 top-16 w-52 glass-popover rounded-2xl z-50 overflow-hidden text-[15px] select-none text-white animate-[fadeIn_0.15s_ease-out] border border-white/5 shadow-2x">
      <div className="flex flex-col py-1.5">
        {periods.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handleSelectPeriod(p)}
            className="flex items-center justify-between px-4 py-3 hover:bg-white/5 active:bg-white/10 text-left transition-colors cursor-pointer"
          >
            <span className={`text-[14px] ${filters.period === p ? "text-white font-semibold" : "text-gray-300"}`}>
              {p}
            </span>
            {filters.period === p && <Check size={15} className="text-blue-400 stroke-[3]" />}
          </button>
        ))}
      </div>
    </div>
  );
}
