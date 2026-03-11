import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";

export interface KahveSection {
  title: string;
  content: string;
}

export function parseKahveSections(text: string): KahveSection[] {
  const parts = text.split(/(?:^|\n)##\s+/);
  const sections: KahveSection[] = [];
  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.trim().split("\n");
    const title = lines[0].trim();
    const content = lines.slice(1).join("\n").trim();
    if (title) sections.push({ title, content });
  }
  return sections;
}

interface Props {
  text: string;
  color: string;
  isLoading?: boolean;
  visibleCount?: number;
}

export function SectionedReading({ text, color, isLoading, visibleCount }: Props) {
  const sections = parseKahveSections(text);

  if (sections.length === 0) {
    return (
      <Text style={styles.plainText}>{text}</Text>
    );
  }

  const limit = visibleCount ?? sections.length;

  return (
    <View style={styles.container}>
      {sections.map((section, i) => {
        const isBlurred = i >= limit;
        return (
          <View
            key={i}
            style={[
              styles.card,
              { borderColor: isBlurred ? color + "18" : color + "35" },
            ]}
          >
            <View style={[styles.cardHeader, { backgroundColor: color + "18" }]}>
              <Text style={[styles.cardTitle, { color }]}>{section.title}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardContent, isBlurred && styles.blurred]}>
                {section.content || (isLoading && i === sections.length - 1 ? "…" : "")}
              </Text>
              {isBlurred && (
                <LinearGradient
                  colors={["transparent", "#0A082099", "#0A0820EE"]}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  plainText: {
    fontSize: 15,
    fontFamily: "Lora_400Regular",
    color: Colors.text,
    lineHeight: 26,
    padding: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#FFFFFF05",
  },
  cardHeader: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: "Lora_700Bold",
    letterSpacing: 0.3,
  },
  cardBody: {
    position: "relative",
  },
  cardContent: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    color: Colors.text,
    lineHeight: 23,
    padding: 14,
    paddingTop: 10,
  },
  blurred: {
    opacity: 0.25,
  },
});
