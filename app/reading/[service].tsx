import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  ActivityIndicator,
  Share,
  Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { fetch } from "expo/fetch";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { getApiUrl } from "@/lib/query-client";

const SERVICE_META_BASE = {
  astroloji: {
    icon: "moon-outline" as const,
    color: "#6B4FBB",
    gradient: ["#1A0F35", "#070D1A"] as [string, string],
  },
  kahve: {
    icon: "cafe-outline" as const,
    color: "#C0932A",
    gradient: ["#2A1A05", "#070D1A"] as [string, string],
  },
  el: {
    icon: "hand-left-outline" as const,
    color: "#1ABFB8",
    gradient: ["#051A1A", "#070D1A"] as [string, string],
  },
  tarot: {
    icon: "layers-outline" as const,
    color: "#E7B008",
    gradient: ["#1A1205", "#070D1A"] as [string, string],
  },
  samanizm: {
    icon: "leaf-outline" as const,
    color: "#4CAF7A",
    gradient: ["#051A0D", "#070D1A"] as [string, string],
  },
  numeroloji: {
    icon: "star-outline" as const,
    color: "#E74C8B",
    gradient: ["#1A0510", "#070D1A"] as [string, string],
  },
  ruh: {
    icon: "eye-outline" as const,
    color: "#9B59B6",
    gradient: ["#150E25", "#070D1A"] as [string, string],
  },
};

const STAR_POSITIONS = Array.from({ length: 12 }, () => ({
  top: Math.random() * 40,
  left: Math.random() * 100,
  duration: 1500 + Math.random() * 2000,
  initialOpacity: Math.random() * 0.5 + 0.2,
}));

function Star({ top, left, duration, initialOpacity }: { top: number; left: number; duration: number; initialOpacity: number }) {
  const opacity = useSharedValue(initialOpacity);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(Math.random() * 0.8 + 0.2, { duration }),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.star, style, { top: `${top}%` as any, left: `${left}%` as any }]} />
  );
}

function StarField() {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      {STAR_POSITIONS.map((pos, i) => (
        <Star key={i} {...pos} />
      ))}
    </View>
  );
}

// ────────── Share Panel ──────────
function SharePanel({ text, serviceLabel }: { text: string; serviceLabel: string }) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const shareText = t.shareText(serviceLabel, text);

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    Linking.openURL(url);
  };

  const shareTwitter = () => {
    const tweet = shareText.slice(0, 280);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
    Linking.openURL(url);
  };

  const copyToClipboard = async () => {
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      } else {
        await Share.share({ message: shareText });
        return;
      }
    } catch {}
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2500);
  };

  const nativeShare = async () => {
    try {
      await Share.share({ message: shareText, title: `Tengri — ${serviceLabel}` });
    } catch {}
  };

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sharePanel}>
      <View style={styles.sharePanelHeader}>
        <Ionicons name="share-social-outline" size={14} color={Colors.gold} />
        <Text style={styles.sharePanelTitle}>{t.share}</Text>
      </View>
      <View style={styles.shareButtons}>
        <Pressable onPress={shareWhatsApp} style={[styles.shareBtn, styles.shareBtnWA]}>
          <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
          <Text style={[styles.shareBtnLabel, { color: "#25D366" }]}>WhatsApp</Text>
        </Pressable>

        <Pressable onPress={shareTwitter} style={[styles.shareBtn, styles.shareBtnTW]}>
          <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
          <Text style={[styles.shareBtnLabel, { color: "#1DA1F2" }]}>Twitter / X</Text>
        </Pressable>

        <Pressable onPress={copyToClipboard} style={[styles.shareBtn, styles.shareBtnCopy]}>
          <Ionicons
            name={copied ? "checkmark-circle" : "copy-outline"}
            size={20}
            color={copied ? "#4CAF7A" : Colors.textSecondary}
          />
          <Text style={[styles.shareBtnLabel, { color: copied ? "#4CAF7A" : Colors.textSecondary }]}>
            {copied ? t.copied : t.copyText}
          </Text>
        </Pressable>

        {Platform.OS !== "web" && (
          <Pressable onPress={nativeShare} style={[styles.shareBtn, styles.shareBtnMore]}>
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
            <Text style={[styles.shareBtnLabel, { color: Colors.textSecondary }]}>Daha Fazla</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

// ────────── Main Screen ──────────
export default function ReadingScreen() {
  const { service } = useLocalSearchParams<{ service: string }>();
  const insets = useSafeAreaInsets();
  const { remainingReadings, isPurchased, consumeTrial, addReading } = useApp();
  const { t } = useLang();

  const base = SERVICE_META_BASE[service as keyof typeof SERVICE_META_BASE] || SERVICE_META_BASE.astroloji;
  const readingMeta = (t.reading_meta as any)[service] || (t.reading_meta as any).astroloji;
  const serviceLabel = (t.services_list as any)[service]?.label || service;

  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [readingText, setReadingText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendButtonScale = useSharedValue(1);
  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
  }));

  const iconPulse = useSharedValue(1);
  React.useEffect(() => {
    if (isLoading) {
      iconPulse.value = withRepeat(
        withSequence(withTiming(1.2, { duration: 600 }), withTiming(0.9, { duration: 600 })),
        -1,
        false
      );
    } else {
      iconPulse.value = withSpring(1);
    }
  }, [isLoading]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconPulse.value }] }));

  const canRead = isPurchased ? true : remainingReadings > 0;

  const handleRead = async () => {
    if (!canRead) {
      router.push("/purchase");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendButtonScale.value = withSpring(0.9, {}, () => {
      sendButtonScale.value = withSpring(1);
    });

    setIsLoading(true);
    setReadingText("");
    setIsDone(false);

    consumeTrial();

    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL("/api/reading", baseUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, userInput }),
      });

      if (!res.ok || !res.body) throw new Error("Server error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.content) {
              fullText += evt.content;
              setReadingText(fullText);
              scrollRef.current?.scrollToEnd({ animated: true });
            }
            if (evt.done) {
              setIsDone(true);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await addReading({
                service,
                serviceLabel,
                content: fullText,
                userInput,
              });
            }
          } catch {}
        }
      }
    } catch {
      setReadingText(t.connectionError);
      setIsDone(true);
    } finally {
      setIsLoading(false);
    }
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[base.gradient[0], base.gradient[1]]}
        style={StyleSheet.absoluteFill}
      />

      <StarField />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Ionicons name={base.icon} size={18} color={base.color} />
          <Text style={styles.headerTitle}>{serviceLabel}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!readingText && !isLoading && (
          <Animated.View entering={FadeIn.duration(600)} style={styles.intro}>
            <Animated.View style={[styles.serviceIconBig, { borderColor: base.color + "40" }, iconStyle]}>
              <Ionicons name={base.icon} size={48} color={base.color} />
            </Animated.View>
            <Text style={styles.introTitle}>{serviceLabel}</Text>
            <Text style={styles.introHint}>{readingMeta.hint}</Text>
          </Animated.View>
        )}

        {isLoading && !readingText && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={base.color} />
            <Text style={[styles.loadingText, { color: base.color }]}>{readingMeta.hint}</Text>
          </View>
        )}

        {!!readingText && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.readingBox}>
            <View style={[styles.readingHeader, { borderBottomColor: base.color + "30" }]}>
              <Ionicons name="sparkles" size={14} color={base.color} />
              <Text style={[styles.readingHeaderText, { color: base.color }]}>
                {t.tengriMessage}
              </Text>
            </View>
            <Text style={styles.readingText}>{readingText}</Text>
            {isLoading && (
              <View style={styles.streamingDot}>
                <ActivityIndicator size="small" color={base.color} />
              </View>
            )}
          </Animated.View>
        )}

        {isDone && readingText && (
          <SharePanel text={readingText} serviceLabel={serviceLabel} />
        )}

        {isDone && (
          <Animated.View entering={FadeIn.delay(400)} style={styles.doneActions}>
            <Pressable
              onPress={() => {
                setReadingText("");
                setIsDone(false);
                setUserInput("");
              }}
              style={styles.newReadBtn}
            >
              <Ionicons name="refresh-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.newReadBtnText}>{t.newReading}</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>

      {!isDone && (
        <View style={[styles.inputArea, { paddingBottom: botPad + 16 }]}>
          <View style={styles.inputLabel}>
            <Text style={styles.inputLabelText}>{readingMeta.inputLabel}</Text>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={userInput}
              onChangeText={setUserInput}
              placeholder={readingMeta.placeholder}
              placeholderTextColor={Colors.textDim}
              multiline
              maxLength={300}
              editable={!isLoading}
            />
            <Animated.View style={sendButtonStyle}>
              <Pressable
                onPress={handleRead}
                disabled={isLoading}
                style={[
                  styles.sendBtn,
                  { backgroundColor: canRead ? base.color : Colors.textDim },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.background} />
                ) : (
                  <Ionicons
                    name={canRead ? "sparkles" : "lock-closed"}
                    size={20}
                    color={Colors.background}
                  />
                )}
              </Pressable>
            </Animated.View>
          </View>

          {!canRead && (
            <Pressable onPress={() => router.push("/purchase")} style={styles.purchaseNudge}>
              <Text style={styles.purchaseNudgeText}>
                {t.freeTrial} •{" "}
                <Text style={{ color: Colors.gold }}>{t.buyPackage}</Text>
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: "CinzelDecorative_400Regular",
    color: Colors.text,
    letterSpacing: 0.5,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flexGrow: 1,
  },
  intro: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 30,
    gap: 16,
  },
  serviceIconBig: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  introTitle: {
    fontSize: 22,
    fontFamily: "CinzelDecorative_700Bold",
    color: Colors.text,
    textAlign: "center",
  },
  introHint: {
    fontSize: 14,
    fontFamily: "Lora_400Regular_Italic",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
    paddingTop: 60,
    gap: 20,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Lora_400Regular_Italic",
  },
  readingBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginTop: 8,
    marginBottom: 16,
  },
  readingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  readingHeaderText: {
    fontSize: 11,
    fontFamily: "CinzelDecorative_400Regular",
    letterSpacing: 2,
  },
  readingText: {
    padding: 16,
    fontSize: 15,
    fontFamily: "Lora_400Regular",
    color: Colors.text,
    lineHeight: 26,
  },
  streamingDot: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // Share panel
  sharePanel: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gold + "25",
    padding: 14,
    marginBottom: 12,
  },
  sharePanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sharePanelTitle: {
    fontSize: 11,
    fontFamily: "CinzelDecorative_400Regular",
    color: Colors.gold,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  shareButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  shareBtnWA: {
    borderColor: "#25D36640",
    backgroundColor: "#25D36610",
  },
  shareBtnTW: {
    borderColor: "#1DA1F240",
    backgroundColor: "#1DA1F210",
  },
  shareBtnCopy: {
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surfaceElevated,
  },
  shareBtnMore: {
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surfaceElevated,
  },
  shareBtnLabel: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
  },

  doneActions: {
    alignItems: "center",
    paddingVertical: 8,
  },
  newReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  newReadBtnText: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
    color: Colors.textSecondary,
  },
  star: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.gold,
  },
  inputArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    backgroundColor: Colors.background,
    gap: 8,
  },
  inputLabel: {},
  inputLabelText: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
    color: Colors.textDim,
    letterSpacing: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    minHeight: 48,
    maxHeight: 100,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  purchaseNudge: {
    alignItems: "center",
    paddingBottom: 4,
  },
  purchaseNudgeText: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    color: Colors.textDim,
  },
});
