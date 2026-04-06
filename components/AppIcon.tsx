import React from "react";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Colors } from "@/constants/colors";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

interface AppIconProps {
  name: IoniconsName;
  size?: number;
  color?: string;
}

export function AppIcon({ name, size = 16, color = Colors.gold }: AppIconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
