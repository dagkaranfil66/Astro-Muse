import React from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

export default function CameraKahveModal({ visible, onClose, color = "#C9A84C" }: Props) {
  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={sty.container}>
        <Ionicons name="camera-outline" size={60} color={color} />
        <Text style={sty.title}>Kamera Web'de Desteklenmiyor</Text>
        <Text style={sty.sub}>Lütfen galeri ile fotoğraf yükleyin.</Text>
        <Pressable onPress={onClose} style={[sty.btn, { backgroundColor: color }]}>
          <Text style={sty.btnText}>Geri Dön</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const sty = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  title: {
    fontFamily: "Lora_700Bold",
    fontSize: 20,
    color: Colors.text,
    textAlign: "center",
  },
  sub: {
    fontFamily: "Lora_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  btn: {
    marginTop: 12,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 30,
  },
  btnText: {
    fontFamily: "Lora_700Bold",
    fontSize: 15,
    color: "#000",
  },
});
