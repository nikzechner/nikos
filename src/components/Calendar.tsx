import React, { useRef, useEffect, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarItem } from "@/types/calendar";

interface CalendarProps {
  date?: Date;
  onExternalDrop?: (eventData: any, startStr: string) => void;
  events: CalendarItem[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarItem[]>>;
  onEventClick?: (eventId: string, eventType: 'event' | 'task') => void;
}

// Utility functions for future backend integration
export const calendarUtils = {
  updateEvent: (events: CalendarItem[], updated: CalendarItem): CalendarItem[] =>
    events.map(e => e.id === updated.id ? { ...e, ...updated } : e),
  moveEvent: (events: CalendarItem[], id: string, start: string, end: string): CalendarItem[] =>
    events.map(e => e.id === id ? { ...e, start, end } : e),
  resizeEvent: (events: CalendarItem[], id: string, start: string, end: string): CalendarItem[] =>
    events.map(e => e.id === id ? { ...e, start, end } : e),
  deleteEvent: (events: CalendarItem[], id: string): CalendarItem[] =>
    events.filter(e => e.id !== id),
  addEvent: (events: CalendarItem[], newEvent: CalendarItem): CalendarItem[] =>
    [...events, newEvent],
};

// Dummy fetch function (simulate API call)
async function fetchCalendarItems(): Promise<CalendarItem[]> {
  // Simulate network delay
  await new Promise(res => setTimeout(res, 200));
  return [
    {
      id: "1",
      title: "Sample Event",
      start: new Date().setHours(9, 0, 0, 0),
      end: new Date().setHours(10, 0, 0, 0),
      type: "event" as const,
      googleEventId: undefined,
    },
    {
      id: "2",
      title: "Scheduled Task",
      start: new Date().setHours(13, 0, 0, 0),
      end: new Date().setHours(14, 30, 0, 0),
      type: "task" as const,
      taskId: "task-123",
    },
  ].map(e => ({ ...e, start: new Date(e.start).toISOString(), end: new Date(e.end).toISOString() })) as CalendarItem[];
}

// Custom event content for a modern look
function renderEventContent(eventInfo: any) {
  const event = eventInfo.event;
  const startTime = event.start;
  const endTime = event.end;
  const isGoogleEvent = event.extendedProps?.isGoogleEvent || false;
  
  // Calculate duration for display
  const durationMs = endTime ? endTime.getTime() - startTime.getTime() : 30 * 60 * 1000;
  const durationMinutes = Math.round(durationMs / (60 * 1000));
  
  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: false 
    });
  };

  // Determine if we should show time details based on duration
  const showTimeDetails = durationMinutes >= 45;

  // Different styling for Google Calendar events vs local tasks
  const baseClasses = "flex flex-col gap-0.5 px-3 py-2 h-full rounded-lg shadow-sm border transition-all duration-200 cursor-pointer overflow-hidden";
  const eventClasses = isGoogleEvent
    ? `${baseClasses} bg-gradient-to-br from-green-500/90 to-green-600/90 text-white border-green-400/30 hover:shadow-lg hover:from-green-500 hover:to-green-600`
    : `${baseClasses} bg-gradient-to-br from-blue-500/90 to-blue-600/90 text-white border-blue-400/30 hover:shadow-lg hover:from-blue-500 hover:to-blue-600`;

  return (
    <div
      className={eventClasses}
      style={{ minHeight: '100%' }}
    >
      <div className="flex justify-between items-center min-h-[16px]">
        <div className="flex items-center gap-1 flex-1">
          {isGoogleEvent && (
            <svg className="w-3 h-3 opacity-90 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          <span className="font-semibold text-sm truncate leading-tight">{event.title}</span>
        </div>
        {durationMinutes >= 30 && (
          <span className="text-xs opacity-90 ml-2 font-medium whitespace-nowrap">
            {durationMinutes >= 60 
              ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 > 0 ? ` ${durationMinutes % 60}m` : ''}`
              : `${durationMinutes}m`
            }
          </span>
        )}
      </div>
      {showTimeDetails && (
        <div className="text-xs opacity-85 font-medium leading-tight">
          {formatTime(startTime)} - {endTime ? formatTime(endTime) : ''}
        </div>
      )}
      {durationMinutes >= 90 && event.extendedProps?.description && (
        <div className="text-xs opacity-75 truncate leading-tight mt-0.5">
          {event.extendedProps.description}
        </div>
      )}
    </div>
  );
}

export default function Calendar({ date, onExternalDrop, events, setEvents, onEventClick }: CalendarProps) {
  const calendarRef = useRef<FullCalendar | null>(null);
  const hasInitialScrolled = useRef(false);

  // Helper function to scroll to appropriate time
  const scrollToTime = useCallback(() => {
    if (!calendarRef.current) return;
    
    const calendarApi = calendarRef.current.getApi();
    const now = new Date();
    const viewingDate = date || new Date();
    const isToday = viewingDate.toDateString() === now.toDateString();
    
    if (isToday) {
      // Get current time and scroll to it
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Center the current time in the viewport by scrolling to a bit before it
      // This creates a more natural centered view
      const scrollHour = Math.max(5, currentHour - 2); // Don't scroll before 5am
      const timeString = scrollHour + ':' + String(currentMinute).padStart(2, '0');
      
      calendarApi.scrollToTime(timeString);
    } else {
      // For other dates, scroll to 8am as a reasonable default
      calendarApi.scrollToTime('08:00');
    }
  }, [date]);

  // Auto-center to current time on initial load and date changes
  useEffect(() => {
    // Small delay to ensure calendar is fully rendered
    const timer = setTimeout(() => {
      scrollToTime();
      hasInitialScrolled.current = true;
    }, 200);
    
    return () => clearTimeout(timer);
  }, [date, scrollToTime]); // Re-center when date changes

  // Re-center when events load for the first time
  useEffect(() => {
    if (!hasInitialScrolled.current && events.length > 0) {
      const timer = setTimeout(scrollToTime, 100);
      return () => clearTimeout(timer);
    }
  }, [events, scrollToTime]);

  // Remove local events state and dummy fetch
  // Use setEvents for all event operations
  const handleEventDrop = useCallback((info: any) => {
    const { id } = info.event;
    const start = info.event.start?.toISOString() || "";
    const end = info.event.end?.toISOString() || start;
    setEvents(prev => calendarUtils.moveEvent(prev, id, start, end));
  }, [setEvents]);

  const handleEventResize = useCallback((info: any) => {
    const { id } = info.event;
    const start = info.event.start?.toISOString() || "";
    const end = info.event.end?.toISOString() || start;
    setEvents(prev => calendarUtils.resizeEvent(prev, id, start, end));
  }, [setEvents]);

  const handleDateSelect = useCallback((selectInfo: any) => {
    // Example: create a new TaskBlock on select
    const newEvent: CalendarItem = {
      id: Math.random().toString(36).slice(2),
      title: "New Task",
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      type: "task",
      taskId: undefined,
    };
    setEvents(prev => calendarUtils.addEvent(prev, newEvent));
  }, [setEvents]);

  // Handler for clicking on calendar events
  const handleEventClick = useCallback((clickInfo: any) => {
    const event = clickInfo.event;
    const eventData = events.find(e => e.id === event.id);
    if (eventData && onEventClick) {
      onEventClick(event.id, eventData.type);
    }
  }, [events, onEventClick]);

  // Handler for external drop
  const handleEventReceive = useCallback((info: any) => {
    if (onExternalDrop) {
      onExternalDrop(info.event.extendedProps, info.event.startStr);
      // Optionally remove the event from the calendar if you want to control state from parent
      info.event.remove();
    }
  }, [onExternalDrop]);

  return (
    <div className="h-full overflow-hidden">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridDay"
        initialDate={date || new Date()}
        headerToolbar={false}
        height="100%"
        slotMinTime="05:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        editable={true}
        selectable={true}
        selectMirror={true}
        eventResizableFromStart={true}
        eventMinHeight={15}
        events={events.map(event => ({
          ...event,
          extendedProps: {
            isGoogleEvent: 'isGoogleEvent' in event ? event.isGoogleEvent : false,
            description: event.description,
          }
        }))}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        select={handleDateSelect}
        eventContent={renderEventContent}
        dayHeaderFormat={{ weekday: "short", day: "numeric", month: "short" }}
        slotLabelFormat={{ hour: "numeric", minute: "2-digit", hour12: false }}
        eventClassNames={() =>
          "!bg-transparent !shadow-none !border-none"
        }
        dayHeaderClassNames={() =>
          "text-slate-700 dark:text-slate-200 font-semibold text-xs border-b border-border pb-1 bg-transparent"
        }
        slotLaneClassNames={() => "bg-card dark:bg-slate-900"}
        slotLabelClassNames={() => "text-xs text-muted-foreground font-mono"}
        viewClassNames={() => "bg-card dark:bg-slate-900"}
        slotDuration="00:30:00"
        slotLabelInterval="01:00"
        nowIndicator={true}
        themeSystem={undefined}
        eventReceive={handleEventReceive}
        eventClick={handleEventClick}
      />
      <style jsx global>{`
        .fc {
          height: 100% !important;
        }
        .fc .fc-view-harness {
          height: 100% !important;
        }
        .fc .fc-scroller {
          overflow-y: auto !important;
          height: 100% !important;
        }
        .fc .fc-timegrid-slot {
          border-color: theme('colors.border');
          height: 30px !important;
        }
        .fc .fc-timegrid-slot.fc-timegrid-slot-label {
          background: transparent;
        }
        .fc .fc-timegrid-col {
          background: transparent;
        }
        .fc .fc-timegrid-axis-cushion {
          font-size: 0.75rem;
          color: theme('colors.muted-foreground');
        }
        .fc .fc-timegrid-event {
          margin: 1px 2px !important;
          border-radius: 6px !important;
        }
        .fc .fc-timegrid-event .fc-event-main {
          padding: 0 !important;
          height: 100% !important;
        }
        .fc .fc-timegrid-event .fc-event-main-frame {
          height: 100% !important;
        }
        .fc .fc-scrollgrid {
          border-radius: 0.75rem;
          border: none;
        }
        .fc .fc-timegrid-divider {
          display: none;
        }
        .fc .fc-timegrid-now-indicator-line {
          background: #ef4444 !important;
          height: 2px;
        }
        .fc .fc-timegrid-now-indicator-arrow {
          border-top-color: #ef4444 !important;
        }
        .fc-event {
          border: none !important;
          background: transparent !important;
        }
      `}</style>
    </div>
  );
} 