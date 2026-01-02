// Calendar.tsx
"use client";

// import "react-day-picker/lib/style.css";   // ← make sure you have v8’s CSS imported
import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames: userClassNames = {},
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-white rounded-lg shadow", className)}
      classNames={{
        /* overall multi-month wrapper */  
        months: "flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4",  
        /* each month container */  
        month: "space-y-4",  

        /* caption (month title + nav) */  
        caption: "flex items-center justify-between px-2 pt-1",  
        caption_label: "text-sm font-medium",  

        /* nav buttons wrapper (inside caption) */  
        nav: "flex items-center space-x-1",  

        /* your custom arrow buttons */  
        nav_button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "p-1 h-7 w-7 bg-transparent opacity-50 hover:opacity-100"
        ),  
        nav_button_next: cn(
          buttonVariants({ variant: "outline" }),
          "p-1 h-7 w-7 bg-transparent opacity-50 hover:opacity-100"
        ),  

        /* the calendar grid */  
        table: "w-full border-collapse space-y-1",  
        head_row: "flex",  
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] flex items-center justify-center",  
        row: "flex w-full mt-2",  

        /* each day cell wrapper */  
        cell: cn(
          "relative p-0 text-center text-sm focus-within:z-20 focus-within:relative",
          "[&:has([aria-selected])]:bg-accent",
          "[&:has([aria-selected].day-outside)]:bg-accent/50",
          "[&:has([aria-selected].day-range-end)]:rounded-r-md",
          "first:[&:has([aria-selected])]:rounded-l-md",
          "last:[&:has([aria-selected])]:rounded-r-md"
        ),  
        /* the button inside each cell */  
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100"
        ),  

        /* modifiers */  
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",  
        day_today: "bg-accent text-accent-foreground",  
        day_outside:
          "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",  
        day_disabled: "text-muted-foreground opacity-50",  
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",  
        day_range_end: "day-range-end",  
        day_hidden: "invisible",

        /* allow any overrides via props.classNames */
        ...userClassNames,
      }}
      components={{
        IconLeft: (props) => <ChevronLeft {...props} className="h-4 w-4" />,
        IconRight: (props) => <ChevronRight {...props} className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";
