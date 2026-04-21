"use client";

import type { SlashCommandItem } from "@/types/blocks";
import {
  AlignLeft, Heading1, Heading2, Heading3, Quote, List, ListOrdered,
  Image as ImageIcon, Code2, Minus, Sparkles, Package, CalendarDays,
  Table2, ListChecks, Play, Sigma,
} from "lucide-react";

type SlashCommandMenuProps = {
  items: SlashCommandItem[];
  selectedIndex: number;
  coords: { top: number; left: number };
  onSelect: (item: SlashCommandItem) => void;
};

const iconMap: Record<string, React.ReactNode> = {
  AlignLeft: <AlignLeft className="h-5 w-5" />,
  Heading1: <Heading1 className="h-5 w-5" />,
  Heading2: <Heading2 className="h-5 w-5" />,
  Heading3: <Heading3 className="h-5 w-5" />,
  Quote: <Quote className="h-5 w-5" />,
  List: <List className="h-5 w-5" />,
  ListOrdered: <ListOrdered className="h-5 w-5" />,
  Image: <ImageIcon className="h-5 w-5" />,
  Code2: <Code2 className="h-5 w-5" />,
  Minus: <Minus className="h-5 w-5" />,
  Sparkles: <Sparkles className="h-5 w-5" />,
  Package: <Package className="h-5 w-5" />,
  CalendarDays: <CalendarDays className="h-5 w-5" />,
  Table2: <Table2 className="h-5 w-5" />,
  ListChecks: <ListChecks className="h-5 w-5" />,
  Youtube: <Play className="h-5 w-5" />,
  Sigma: <Sigma className="h-5 w-5" />,
};

export function SlashCommandMenu({
  items,
  selectedIndex,
  coords,
  onSelect,
}: SlashCommandMenuProps) {
  if (items.length === 0) return null;

  return (
    <div
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-2 w-80 max-h-64 overflow-y-auto"
      style={{ top: coords.top + 4, left: coords.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {items.map((item, idx) => (
        <button
          key={item.type}
          type="button"
          onClick={() => onSelect(item)}
          className={`w-full flex items-start gap-3 p-2 rounded transition ${
            idx === selectedIndex
              ? "bg-stone-100"
              : "hover:bg-gray-100"
          }`}
        >
          <div className="flex-shrink-0 mt-1 text-gray-600">
            {iconMap[item.icon] || <AlignLeft className="h-5 w-5" />}
          </div>
          <div className="flex-grow text-left">
            <div className="font-medium text-sm text-gray-900">
              {item.label}
            </div>
            <div className="text-xs text-gray-500">
              {item.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
