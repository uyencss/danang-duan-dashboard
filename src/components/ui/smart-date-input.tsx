import * as React from "react";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";

interface SmartDateInputProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  showTime?: boolean;
}

export function SmartDateInput({ 
  value, 
  onChange, 
  className, 
  placeholder,
  showTime = false 
}: SmartDateInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const defaultPlaceholder = showTime ? "dd/mm/yyyy hh:mm" : "ngày/tháng/năm";

  // Sync internal state with external value
  React.useEffect(() => {
    if (value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setInputValue(format(date, showTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy"));
        }
      } catch (e) {
        setInputValue("");
      }
    } else {
      setInputValue("");
    }
  }, [value, showTime]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Auto-formatter
    const isDelete = (e.nativeEvent as any).inputType?.includes("delete");
    if (!isDelete) {
        if ((val.length === 2 || val.length === 5) && !val.endsWith("/")) {
            val = val + "/";
        } else if (val.length === 13 && !val.endsWith(":")) {
            val = val + ":";
        }
    }
    
    setInputValue(val);

    // Try to parse if it looks like a full date/datetime
    const targetLengthMin = showTime ? 13 : 10; // Use 10 for dd/mm/yyyy
    
    if (val.length >= targetLengthMin) {
      const formats = showTime 
        ? ["dd/MM/yyyy HH:mm", "d/M/yyyy H:m", "d/M/yyyy HH:mm", "dd/MM/yyyy H:m"]
        : ["dd/MM/yyyy", "d/M/yyyy", "d/m/yyyy"];
      
      for (const fmt of formats) {
        const parsedDate = parse(val, fmt, new Date());
        if (isValid(parsedDate)) {
          onChange(showTime ? format(parsedDate, "yyyy-MM-dd'T'HH:mm") : format(parsedDate, "yyyy-MM-dd"));
          break;
        }
      }
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    if (newVal) {
      onChange(newVal);
      // Immediately reflect in internal state for responsiveness
      try {
        const date = new Date(newVal);
        if (!isNaN(date.getTime())) {
          setInputValue(format(date, showTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy"));
        }
      } catch(ex) {}
    }
  };

  return (
    <div className={cn("relative group/date-input flex items-center w-full", className)}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder || defaultPlaceholder}
        className={cn(
          "flex h-[44px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base font-black text-[#0d1f3c] transition-all placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12 shadow-sm z-10",
          className
        )}
        autoComplete="off"
      />
      
      {/* Icon Area with Native Date Input Overlay */}
      <div className="absolute right-0 top-0 h-full w-[48px] flex items-center justify-center z-20">
        <div className="pointer-events-none text-slate-400 group-hover/date-input:text-blue-600 transition-colors">
          {showTime ? (
            <Clock className="size-5" />
          ) : (
            <CalendarIcon className="size-5" />
          )}
        </div>
        
        {/* Hidden native input on top of the icon ONLY */}
        <input
          type={showTime ? "datetime-local" : "date"}
          className="absolute inset-0 opacity-0 cursor-pointer z-30"
          onChange={handleNativeChange}
          value={value || ""}
          title="Chọn ngày từ lịch"
          onClick={(e) => {
             if ('showPicker' in e.currentTarget) {
                 try { (e.currentTarget as any).showPicker(); } catch(err) {}
             }
          }}
        />
      </div>
    </div>
  );
}


