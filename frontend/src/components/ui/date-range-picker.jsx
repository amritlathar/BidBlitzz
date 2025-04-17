import React from 'react';
import { cn } from '@/lib/utils';

const DateRangePicker = React.forwardRef(({ className, value, onChange, ...props }, ref) => {
  const handleFromChange = (e) => {
    const newValue = {
      ...value,
      from: e.target.value // Will be in yyyy-MM-dd format
    };
    onChange(newValue);
  };

  const handleToChange = (e) => {
    const newValue = {
      ...value,
      to: e.target.value // Will be in yyyy-MM-dd format
    };
    onChange(newValue);
  };

  return (
    <div className={cn("flex items-center space-x-2", className)} ref={ref} {...props}>
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1">From</label>
        <input
          type="date"
          value={value?.from || ''}
          onChange={handleFromChange}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1">To</label>
        <input
          type="date"
          value={value?.to || ''}
          onChange={handleToChange}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          min={value?.from} // Ensure 'to' date can't be before 'from' date
        />
      </div>
    </div>
  );
});

DateRangePicker.displayName = "DateRangePicker";

export { DateRangePicker }; 