import React from "react";
import { Text, TextStyle } from "react-native";

interface Props {
  size?: number;
  color?: string;
  style?: TextStyle;
}

export function GoldStar({ size = 12, color = "#C9A227", style }: Props) {
  return (
    <Text style={[{ fontSize: size, color, lineHeight: size * 1.3 }, style]}>
      {"✦"}
    </Text>
  );
}
