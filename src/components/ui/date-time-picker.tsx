"use client";

import { useState } from "react";
import { format, setHours, setMinutes } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

type Props = {
  value?: Date;
  onChange: (date?: Date) => void;
  placeholder?: string;
};

export function DateTimePicker({ value, onChange, placeholder = "Pick date & time" }: Props) {
  const [open, setOpen] = useState(false);

  const selectedHour = value ? value.getHours() : 9;
  const selectedMinute = value ? Math.round(value.getMinutes() / 15) * 15 % 60 : 0;

  function handleDaySelect(day?: Date) {
    if (!day) { onChange(undefined); return; }
    const base = value ?? day;
    onChange(setMinutes(setHours(day, base.getHours()), base.getMinutes()));
  }

  function handleHourChange(h: number) {
    const base = value ?? new Date();
    onChange(setHours(base, h));
  }

  function handleMinuteChange(m: number) {
    const base = value ?? new Date();
    onChange(setMinutes(base, m));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {value ? format(value, "PPP · HH:mm") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value}
          captionLayout="dropdown"
          fromYear={1920}
          toYear={new Date().getFullYear() + 5}
          onSelect={handleDaySelect}
        />
        <div className="border-t px-3 py-2">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Time</p>
          <div className="flex gap-2">
            <select
              value={selectedHour}
              onChange={(e) => handleHourChange(Number(e.target.value))}
              className="h-8 flex-1 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}h
                </option>
              ))}
            </select>
            <select
              value={selectedMinute}
              onChange={(e) => handleMinuteChange(Number(e.target.value))}
              className="h-8 flex-1 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  :{String(m).padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
