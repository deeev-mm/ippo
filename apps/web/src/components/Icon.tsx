import { HelpCircle } from "lucide-react";
import { ICONS } from "@/lib/icons";

export function Icon({
  name,
  size = 20,
  strokeWidth,
  className,
}: {
  name?: string | null;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const Cmp = (name && ICONS[name]) || HelpCircle;
  return <Cmp size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
}
