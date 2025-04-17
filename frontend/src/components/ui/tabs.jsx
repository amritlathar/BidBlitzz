import { useState } from "react";
import { cn } from "../../lib/utils.js";
import React from "react";

const TabsContext = React.createContext({});

const Tabs = ({ defaultValue, value, onValueChange, className, children, ...props }) => {
  const [localValue, setLocalValue] = useState(defaultValue);
  const currentValue = value ?? localValue;

  const handleValueChange = (newValue) => {
    setLocalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab: currentValue, setActiveTab: handleValueChange }}>
      <div 
        role="tablist"
        className={cn("w-full", className)} 
        {...props}
      >
        {React.Children.map(children, child => {
          if (!React.isValidElement(child)) return child;
          
          return React.cloneElement(child, {
            selectedValue: currentValue,
            onSelect: handleValueChange,
          });
        })}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ className, children, selectedValue, onSelect, ...props }) => {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    >
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return child;
        
        return React.cloneElement(child, {
          selectedValue,
          onSelect,
        });
      })}
    </div>
  );
};

const TabsTrigger = ({ value, selectedValue, onSelect, className, children, ...props }) => {
  return (
    <button
      role="tab"
      aria-selected={selectedValue === value}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        selectedValue === value
          ? "bg-background text-foreground shadow-sm"
          : "hover:bg-background hover:text-foreground",
        className
      )}
      onClick={() => onSelect?.(value)}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, selectedValue, className, children, ...props }) => {
  if (value !== selectedValue) return null;

  return (
    <div
      role="tabpanel"
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
