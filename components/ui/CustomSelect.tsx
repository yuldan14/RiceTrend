"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/utils/style";

export interface SelectOption<TValue extends string> {
  value: TValue;
  label: string;
  icon?: string;
  badge?: string;
}

export interface CustomSelectProps<TValue extends string> {
  id: string;
  label: string;
  value: TValue;
  placeholder: string;
  options: Array<SelectOption<Exclude<TValue, "">>>;
  onChange: (value: Exclude<TValue, "">) => void;
  disabled?: boolean;
  className?: string;
}

export function CustomSelect<TValue extends string>({
  id,
  label,
  value,
  placeholder,
  options,
  onChange,
  disabled = false,
  className,
}: CustomSelectProps<TValue>) {
  return (
    <div className={cn("min-w-0 flex-1 space-y-2", className)}>
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </label>
      <Select.Root
        value={value || undefined}
        onValueChange={(nextValue) => onChange(nextValue as Exclude<TValue, "">)}
        disabled={disabled}
      >
        <Select.Trigger
          id={id}
          className="flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-border bg-white px-4 text-left text-sm font-medium text-slate-900 shadow-sm transition hover:border-brand-500 focus:shadow-glow data-[state=open]:border-brand-500 data-[state=open]:shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={label}
        >
          <Select.Value placeholder={placeholder} />
          <Select.Icon>
            <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={8}
            className="z-[80] min-w-[var(--radix-select-trigger-width)] origin-top overflow-hidden rounded-xl border border-border bg-white p-1 shadow-card data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
          >
            <Select.Viewport>
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className="relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2.5 pr-9 text-sm text-slate-800 outline-none transition hover:bg-brand-50 focus:bg-brand-50 data-[state=checked]:bg-brand-50"
                >
                  {option.icon && <span aria-hidden="true">{option.icon}</span>}
                  <Select.ItemText>{option.label}</Select.ItemText>
                  {option.badge && (
                    <span className="ml-auto rounded-badge bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                      {option.badge}
                    </span>
                  )}
                  <Select.ItemIndicator className="absolute right-2 inline-flex items-center">
                    <Check className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

export default CustomSelect;
