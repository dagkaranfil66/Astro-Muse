import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Platform,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions, FlashMode } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

interface CapturedPhoto {
  uri: string;
  base64: string;
  type: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onCapture: (photo: CapturedPhoto) => void;
  color?: string;
}

const GOLD = "#C9A84C";

export default function CameraKahveModal({ visible, onClose, onCapture, color = GOLD }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<FlashMode>("off");
  const [capturing, setCapturing] = useState(false);
  const insets = useSafeAreaInsets();

  const pulse = useSharedValue(1);
  const ringOpacity = useSharedValue(0.6);

  React.useEffect(() => {
    if (!visible) return;
    pulse.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, false
    );
    ringOpacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 1200 }), withTiming(0.4, { duration: 1200 })), -1, false
    );
  }, [visible]);

  const frameStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: ringOpacity.value }));

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.82,
        exif: false,
      });
      if (photo?.base64) {
        onCapture({
          uri: photo.uri,
          base64: photo.base64,
          type: "image/jpeg",
        });
        onClose();
      }
    } catch {
    } finally {
      setCapturing(false);
    }
  };

  if (!visible) return null;

  if (Platform.OS === "web") {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={[sty.container, { justifyContent: "center", alignItems: "center" }]}>
          <Ionicons name="camera-outline" size={64} color={color} />
          <Text style={sty.permText}>Kamera web'de desteklenmiyor.</Text>
          <Text style={sty.permSub}>Lütfen galeri ile fotoğraf yükleyin.</Text>
          <Pressable onPress={onClose} style={[sty.permBtn, { backgroundColor: color }]}>
            <Text style={sty.permBtnText}>Geri Dön</Text>
          </Pressable>
        </View>
      </Modal>
    );
  }

  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={[sty.container, { justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator size="large" color={color} />
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={[sty.container, { justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }]}>
          <Ionicons name="camera-outline" size={60} color={color} />
          <Text style={sty.permText}>Kamera İzni Gerekli</Text>
          <Text style={sty.permSub}>
            Fincanınızı okuyabilmek için kamera iznine ihtiyacımız var.
          </Text>
          <Pressable onPress={requestPermission} style={[sty.permBtn, { backgroundColor: color }]}>
            <Text style={sty.permBtnText}>İzin Ver</Text>
          </Pressable>
          <Pressable onPress={onClose} style={sty.permClose}>
            <Text style={[sty.permSub, { color: Colors.textDim }]}>Vazgeç</Text>
          </Pressable>
        </View>
      </Modal>
    );
  }

  const topPad = Math.max(insets.top, 20);
  const botPad = Math.max(insets.bottom, 20);

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={sty.container}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          flash={flash}
        />

        {/* Dark vignette corners */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={sty.vignette} />
        </View>

        {/* Header */}
        <View style={[sty.header, { paddingTop: topPad }]}>
          <Pressable onPress={onClose} style={sty.headerBtn} hitSlop={12}>
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
          <View style={sty.headerTitleWrap}>
            <Text style={sty.headerTitle}>☕ Kahve Falı</Text>
            <Text style={sty.headerSub}>Fincanı çerçeveye yerleştirin</Text>
          </View>
          <Pressable
            onPress={() => setFlash((f) => (f === "off" ? "on" : "off"))}
            style={[sty.headerBtn, flash === "on" && { backgroundColor: GOLD + "30" }]}
            hitSlop={12}
          >
            <Ionicons
              name={flash === "on" ? "flash" : "flash-off"}
              size={22}
              color={flash === "on" ? GOLD : "#fff"}
            />
          </Pressable>
        </View>

        {/* Cup frame guide */}
        <View style={sty.frameArea} pointerEvents="none">
          {/* Outer pulsing ring */}
          <Animated.View style={[sty.pulseRing, { borderColor: color }, ringStyle]} />
          {/* Main frame */}
          <Animated.View style={[sty.frame, { borderColor: color }, frameStyle]}>
            {/* Corner ornaments */}
            {[
              { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3 },
              { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3 },
              { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3 },
              { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3 },
            ].map((corner, i) => (
              <View key={i} style={[sty.corner, { borderColor: color }, corner]} />
            ))}
            {/* Center crosshair */}
            <View style={sty.crosshairH} />
            <View style={sty.crosshairV} />
          </Animated.View>
          <Text style={[sty.frameHint, { color: color + "CC" }]}>
            Tüm fincanın görünür olduğundan emin olun
          </Text>
        </View>

        {/* Bottom controls */}
        <View style={[sty.bottom, { paddingBottom: botPad + 16 }]}>
          <Text style={sty.bottomHint}>
            ✦ Tengri fincanınızı okuyacak
          </Text>
          <Pressable
            onPress={handleCapture}
            disabled={capturing}
            style={[sty.captureBtn, { borderColor: color }]}
          >
            {capturing ? (
              <ActivityIndicator size="large" color={color} />
            ) : (
              <View style={[sty.captureBtnInner, { backgroundColor: color }]} />
            )}
          </Pressable>
          <Text style={sty.bottomSubHint}>Butona bas ve fali başlat</Text>
        </View>
      </View>
    </Modal>
  );
}

const sty = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  vignette: {
    flex: 1,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.8,
    shadowRadius: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Lora_700Bold",
    fontSize: 17,
    color: "#fff",
  },
  headerSub: {
    fontFamily: "Lora_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
  },
  frameArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
  },
  frame: {
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "transparent",
  },
  crosshairH: {
    position: "absolute",
    width: 24,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  crosshairV: {
    position: "absolute",
    width: 1,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  frameHint: {
    fontFamily: "Lora_400Regular_Italic",
    fontSize: 12,
    textAlign: "center",
    marginTop: 18,
    paddingHorizontal: 40,
  },
  bottom: {
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 10,
  },
  bottomHint: {
    fontFamily: "Lora_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.5,
  },
  captureBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  captureBtnInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  bottomSubHint: {
    fontFamily: "Lora_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.38)",
  },
  permText: {
    fontFamily: "Lora_700Bold",
    fontSize: 20,
    color: "#fff",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  permSub: {
    fontFamily: "Lora_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 21,
  },
  permBtn: {
    marginTop: 28,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 30,
  },
  permBtnText: {
    fontFamily: "Lora_700Bold",
    fontSize: 15,
    color: "#000",
  },
  permClose: {
    marginTop: 16,
    padding: 8,
  },
});
