"use client";

import React from "react"

import { useState, useMemo } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  label?: string;
}

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const fullMonthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatMonthYear(dateStr: string): string {
  if (dateStr === "all") return "All Dates";
  const [year, month] = dateStr.split("-");
  return `${fullMonthNames[parseInt(month) - 1]} ${year}`;
}

function formatShortMonthYear(dateStr: string): string {
  if (dateStr === "all") return "All";
  const [year, month] = dateStr.split("-");
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

export function DateRangePicker({ value, onChange, label = "Date Range" }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(2024);
  const [selectionState, setSelectionState] = useState<"start" | "end">("start");
  const [tempStart, setTempStart] = useState<string | null>(null);

  // Generate all valid months (Jan 2020 - Mar 2025)
  const validMonths = useMemo(() => {
    const months: string[] = [];
    for (let year = 2020; year <= 2025; year++) {
      const maxMonth = year === 2025 ? 3 : 12;
      for (let month = 1; month <= maxMonth; month++) {
        months.push(`${year}-${month.toString().padStart(2, "0")}`);
      }
    }
    return months;
  }, []);

  const isValidMonth = (year: number, month: number): boolean => {
    const dateStr = `${year}-${month.toString().padStart(2, "0")}`;
    return validMonths.includes(dateStr);
  };

  const handleMonthClick = (year: number, month: number) => {
    const dateStr = `${year}-${month.toString().padStart(2, "0")}`;
    
    if (selectionState === "start") {
      setTempStart(dateStr);
      setSelectionState("end");
    } else {
      // End selection
      const start = tempStart || value.startDate;
      if (start === "all" || dateStr >= start) {
        onChange({ startDate: start === "all" ? dateStr : start, endDate: dateStr });
      } else {
        // If user clicks a date before start, swap them
        onChange({ startDate: dateStr, endDate: start });
      }
      setTempStart(null);
      setSelectionState("start");
      setOpen(false);
    }
  };

  const isInRange = (year: number, month: number): boolean => {
    const dateStr = `${year}-${month.toString().padStart(2, "0")}`;
    const start = tempStart || (value.startDate !== "all" ? value.startDate : null);
    const end = value.endDate !== "all" ? value.endDate : null;
    
    if (!start) return false;
    if (selectionState === "end" && tempStart) {
      // Only show start highlighted during end selection
      return dateStr === tempStart;
    }
    if (start && end) {
      return dateStr >= start && dateStr <= end;
    }
    return dateStr === start;
  };

  const isRangeStart = (year: number, month: number): boolean => {
    const dateStr = `${year}-${month.toString().padStart(2, "0")}`;
    const start = tempStart || (value.startDate !== "all" ? value.startDate : null);
    return dateStr === start;
  };

  const isRangeEnd = (year: number, month: number): boolean => {
    const dateStr = `${year}-${month.toString().padStart(2, "0")}`;
    return selectionState === "start" && value.endDate !== "all" && dateStr === value.endDate;
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ startDate: "all", endDate: "all" });
    setTempStart(null);
    setSelectionState("start");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset temp state on close
      setTempStart(null);
      setSelectionState("start");
    }
  };

const displayText = useMemo(() => {
  if (value.startDate === "all" && value.endDate === "all") {
  return `${label}: All`;
  }
    if (value.startDate === "all") {
      return `${label}: Up to ${formatShortMonthYear(value.endDate)}`;
    }
    if (value.endDate === "all") {
      return `${label}: From ${formatShortMonthYear(value.startDate)}`;
    }
    if (value.startDate === value.endDate) {
      return `${label}: ${formatShortMonthYear(value.startDate)}`;
    }
    return `${label}: ${formatShortMonthYear(value.startDate)} - ${formatShortMonthYear(value.endDate)}`;
  }, [value, label]);

  const hasSelection = value.startDate !== "all" || value.endDate !== "all";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-8 min-w-[155px] justify-start gap-1.5 text-xs font-normal bg-transparent",
            !hasSelection && "text-muted-foreground"
          )}
        >
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="flex-1 text-left">{displayText}</span>
          {hasSelection && (
            <X 
              className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" 
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          {/* Header with instruction */}
          <div className="mb-3 text-center">
            <p className="text-sm text-muted-foreground">
              {selectionState === "start" 
                ? "Select start month" 
                : "Select end month"}
            </p>
            {tempStart && (
              <p className="text-xs text-primary mt-1">
                Start: {formatMonthYear(tempStart)}
              </p>
            )}
          </div>

          {/* Year navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewYear(Math.max(2020, viewYear - 1))}
              disabled={viewYear <= 2020}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-base font-semibold">{viewYear}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewYear(Math.min(2025, viewYear + 1))}
              disabled={viewYear >= 2025}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-4 gap-2">
            {monthNames.map((month, index) => {
              const monthNum = index + 1;
              const isValid = isValidMonth(viewYear, monthNum);
              const inRange = isInRange(viewYear, monthNum);
              const isStart = isRangeStart(viewYear, monthNum);
              const isEnd = isRangeEnd(viewYear, monthNum);

              return (
                <button
                  key={month}
                  type="button"
                  disabled={!isValid}
                  onClick={() => handleMonthClick(viewYear, monthNum)}
                  className={cn(
                    "h-10 rounded-md text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    !isValid && "opacity-30 cursor-not-allowed hover:bg-transparent",
                    inRange && !isStart && !isEnd && "bg-primary/10 text-primary",
                    (isStart || isEnd) && "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  {month}
                </button>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="mt-4 flex gap-2 border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {
                onChange({ startDate: "all", endDate: "all" });
                setTempStart(null);
                setSelectionState("start");
                setOpen(false);
              }}
            >
              All Dates
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {
                onChange({ startDate: "2024-01", endDate: "2024-12" });
                setTempStart(null);
                setSelectionState("start");
                setOpen(false);
              }}
            >
              2024
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {
                onChange({ startDate: "2023-01", endDate: "2023-12" });
                setTempStart(null);
                setSelectionState("start");
                setOpen(false);
              }}
            >
              2023
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
