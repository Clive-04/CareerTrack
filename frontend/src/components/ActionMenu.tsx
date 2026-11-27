"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";

export type ActionMenuItem =
  | {
      label: string;
      icon?: LucideIcon;
      onSelect: () => void;
      tone?: "danger";
      disabled?: boolean;
    }
  | "separator";

/**
 * Overflow menu for secondary, per-item actions. Follows the WAI-ARIA menu
 * button pattern: arrow keys move focus, Escape closes and returns focus.
 */
export default function ActionMenu({
  label,
  items,
  buttonClassName = "app-icon-button app-icon-button-ghost",
  buttonContent,
  menuClassName = "right-0 top-full mt-1",
  header,
}: {
  label: string;
  items: ActionMenuItem[];
  buttonClassName?: string;
  /** Replaces the default "more" icon, e.g. an account avatar. */
  buttonContent?: ReactNode;
  /** Positioning classes for the menu panel. */
  menuClassName?: string;
  /** Non-interactive context shown above the items. */
  header?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLButtonElement>("[role=menuitem]:not(:disabled)")?.focus();

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  function close(returnFocus = true) {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const options = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]:not(:disabled)") ?? [],
    );
    const index = options.indexOf(document.activeElement as HTMLButtonElement);

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      options[(index + 1) % options.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      options[(index - 1 + options.length) % options.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      options[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      options.at(-1)?.focus();
    } else if (event.key === "Tab") {
      close(false);
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={buttonClassName}
      >
        {buttonContent ?? <MoreHorizontal size={18} aria-hidden="true" />}
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className={`app-menu ${menuClassName}`}
        >
          {header && <div className="border-b border-slate-200 px-3 pb-2 pt-1.5">{header}</div>}
          {items.map((item, index) => {
            if (item === "separator") {
              return <div key={`separator-${index}`} role="separator" className="app-menu-separator" />;
            }
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  close();
                  item.onSelect();
                }}
                className={`app-menu-item ${item.tone === "danger" ? "app-menu-item-danger" : ""} disabled:opacity-50`}
              >
                {Icon && <Icon size={16} aria-hidden="true" />}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
