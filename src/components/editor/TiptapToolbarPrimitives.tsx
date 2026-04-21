"use client";

import type { ComponentType } from "react";

type IconLike = ComponentType<{ className?: string }>;

export function ToolbarToggle({
  active,
  onClick,
  Icon,
  title,
  disabled = false,
}: {
  active: boolean;
  onClick: () => void;
  Icon: IconLike;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded transition ${
        active
          ? "bg-stone-100 text-gray-900"
          : "hover:bg-gray-100 text-gray-700"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function ToolbarSeparator() {
  return <div className="w-px h-6 bg-gray-300 mx-1" />;
}
