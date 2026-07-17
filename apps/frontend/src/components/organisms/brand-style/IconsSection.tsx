"use client";

import { useState, useMemo } from "react";
import { IconDefinition } from "@/types/BrandStyle";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Card } from "@/components/atoms/baseShadcn/card";
import {
  CalendarDays,
  Clock,
  MapPin,
  BookOpen,
  User,
  Settings,
  Bell,
  Search,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Info,
  Moon,
  Sun,
} from "lucide-react";

//icons used
const Icons: IconDefinition[] = [
  { name: "CalendarDays", Icon: CalendarDays },
  { name: "Clock", Icon: Clock },
  { name: "MapPin", Icon: MapPin },
  { name: "BookOpen", Icon: BookOpen },
  { name: "User", Icon: User },
  { name: "Settings", Icon: Settings },
  { name: "Bell", Icon: Bell },
  { name: "Search", Icon: Search },
  { name: "ChevronDown", Icon: ChevronDown },
  { name: "ChevronRight", Icon: ChevronRight },
  { name: "X", Icon: X },
  { name: "Check", Icon: Check },
  { name: "AlertCircle", Icon: AlertCircle },
  { name: "Info", Icon: Info },
  { name: "Moon", Icon: Moon },
  { name: "Sun", Icon: Sun },
];

export function IconsSection() {
  //for the search bar
  const [search, setSearch] = useState("");

  //caching instead of running constantly between renders when searching
  const searchIcons = useMemo(() => {
    const query = search.toLowerCase();
    return Icons.filter((icon) => icon.name.toLowerCase().includes(query));
  }, [search]);

  return (
    <div className="w-full text-left space-y-8 py-8 text-[var(--text-secondary)]">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
          Icons
        </h1>
        <p className="leading-relaxed max-w-2xl">
          Lucide, outline only, never independently coloured. Icons inherit the
          colour of the text they accompany. 16px in body and tables, 20px in
          headings and navigation.
        </p>
      </div>

      <div className="relative max-w-[320px] mb-5">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
        />
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter icons"
          className="pl-[34px] h-9 bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)]"
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
        {searchIcons.map(({ name, Icon }) => (
          <Card
            key={name}
            className="flex items-center gap-3 p-[14px_16px] rounded-lg bg-[var(--bg-surface)] border-[var(--border)] transition-colors duration-[var(--duration-fast)] shadow-none"
          >
            <Icon size={18} className="text-[var(--text-primary)] shrink-0" />
            <span className="text-[12px] font-medium text-[var(--text-secondary)] leading-[1.3] font-mono whitespace-nowrap overflow-hidden text-ellipsis">
              {name}
            </span>
          </Card>
        ))}

        {searchIcons.length === 0 && (
          <p className="col-span-full text-[13px] text-[var(--text-secondary)] p-6 text-center">
            No icons match &ldquo;{search}&rdquo;.
          </p>
        )}
      </div>
    </div>
  );
}
