import * as HeroIcons from "@heroicons/react/24/outline";
import * as HeroIconsSolid from "@heroicons/react/24/solid";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";

interface IconProps {
  name: string;
  variant?: "outline" | "solid";
  size?: number;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export default function Icon({
  name,
  variant = "outline",
  size = 24,
  className = "",
  onClick,
  disabled = false,
}: IconProps) {
  const iconSet = variant === "solid" ? HeroIconsSolid : HeroIcons;
  const IconComponent = (
    iconSet as unknown as Record<string, ComponentType<SVGProps<SVGSVGElement>>>
  )[name];
  const Resolved = IconComponent ?? QuestionMarkCircleIcon;

  return (
    <Resolved
      width={size}
      height={size}
      className={`${disabled ? "opacity-50 cursor-not-allowed" : onClick ? "cursor-pointer hover:opacity-80" : ""} ${className}`}
      {...(disabled || !onClick ? {} : { onClick })}
    />
  );
}
