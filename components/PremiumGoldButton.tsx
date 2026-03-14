import React, { useEffect } from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";

interface Props {
  label: string;
  hint?: string;
  onPress: () => void;
}

export default function PremiumGoldButton({ label, hint, onPress }: Props) {
  const glowOpacity = useSharedValue(0.35);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.35, { duration: 2600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withTiming(0.97, { duration: 80 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 14, stiffness: 200 });
  };

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.container, scaleStyle]}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.pressable}
        >
          <LinearGradient
            colors={["#C8A020", "#7B4FBB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.inner}
          >
            <Ionicons name="diamond-outline" size={15} color="#fff" />
            <Text style={styles.label}>{label}</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
    gap: 10,
  },
  container: {
    width: "100%",
    borderRadius: 14,
    overflow: "visible",
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#C8A020",
    shadowColor: "#C8A020",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  pressable: {
    borderRadius: 14,
    overflow: "hidden",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  label: {
    fontSize: 15,
    fontFamily: "Lora_700Bold",
    color: "#fff",
  },
  hint: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
    color: Colors.textDim,
    textAlign: "center",
  },
});
