import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Colors } from "@/constants/colors";

const GUIDE_SECTIONS = [
  {
    icon: "✦",
    title: "Tengri'ye Hoş Geldiniz",
    body: "Tengri, Kadim Türk mistisizmine dayanan yapay zeka destekli bir rehberlik uygulamasıdır. Binlerce yıllık bilgeliği modern teknoloji ile buluşturarak hayatınıza ışık tutuyoruz.",
    highlight: true,
  },
  {
    icon: "⬡",
    title: "Altın Sistemi Nasıl Çalışır?",
    body: "Her okuma belirli miktarda altın kullanır. Altını üç şekilde kazanabilirsiniz:",
    items: [
      "🎁 Kayıt olduğunuzda 15 ücretsiz altın hediye",
      "🎡 Her gün çarkı çevirerek 2–10 altın kazanın",
      "💰 Altın paketlerinden dilediğinizi satın alın",
    ],
  },
  {
    icon: "☕",
    title: "AI Kahve Analizi — Fotoğraf ile",
    body: "Fincanınızın fotoğrafını çekin ya da galerinizden yükleyin. Tengri, fincan sembollerini analiz ederek size özel bir yorum sunar.",
    items: [
      "Fincanı beyaz arka plan üzerinde, iyi ışıkta fotoğraflayın",
      "Fincanın içi net görünmeli",
      "Analiz genellikle 10–20 saniye sürer",
    ],
    cost: "6",
  },
  {
    icon: "✋",
    title: "El Çizgisi Analizi — Avuç İçi Okuma",
    body: "Avuç içinizin fotoğrafını yükleyin. Kader, yaşam ve kalp çizgileriniz analiz edilir.",
    items: [
      "Avucunuzu düz tutun, parmakları hafifçe açın",
      "İyi aydınlatılmış ortamda çekin",
    ],
    cost: "6",
  },
  {
    icon: "🃏",
    title: "Tarot",
    body: "Zihninizdeki soruyu düşünerek bir kart çekin. Tengri, kartın derin anlamını sizin için yorumlar.",
    cost: "4",
  },
  {
    icon: "❤️",
    title: "Aşk Uyum Analizi",
    body: "İki kişinin enerji uyumunu yapay zeka ile derinlemesine analiz eder. İsim ve doğum bilgileri kullanılır.",
    cost: "6",
  },
  {
    icon: "🌙",
    title: "Rüya Yorumu",
    body: "Rüyanızı yazın, Tengri bilinçaltınızın sembollerini deşifre eder. En iyi sonuç için rüyanızı mümkün olduğunca ayrıntılı anlatın.",
    cost: "6",
  },
  {
    icon: "🌟",
    title: "Astroloji Burç Rehberi",
    body: "Burcunuza özel günlük mistik rehberlik ve enerji analizi. Yıldızların sizin üzerinizdeki etkisini keşfedin.",
    cost: "6",
  },
  {
    icon: "🎡",
    title: "Günlük Çark — Ücretsiz Altın",
    body: "Her 24 saatte bir çarkı çevirerek altın kazanabilirsiniz. Çark kaydırarak döner, nerede durduğu sizin şansınız!",
    items: [
      "Her gün sıfırlanır — kaçırmayın",
      "2 ile 10 altın arası kazanabilirsiniz",
      "Bildirimler açıksa çark hazır olunca haber verilir",
    ],
  },
  {
    icon: "🔗",
    title: "Okumalarınızı Paylaşın",
    body: "Her okuma sonunda sonucu panoya kopyalayabilir ya da arkadaşlarınızla paylaşabilirsiniz.",
  },
  {
    icon: "💬",
    title: "Destek ve İletişim",
    body: "Her türlü sorunuz için bize ulaşabilirsiniz:",
    contact: "tengri@tengristar.com",
  },
];

function GuideCard({
  section,
  index,
}: {
  section: (typeof GUIDE_SECTIONS)[0];
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={[styles.card, section.highlight && styles.cardHighlight]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{section.icon}</Text>
        <Text style={[styles.cardTitle, section.highlight && styles.cardTitleHighlight]}>
          {section.title}
        </Text>
        {section.cost ? (
          <View style={[styles.costBadge, { flexDirection: "row", alignItems: "center", gap: 3 }]}>
            <Text style={styles.costText}>{section.cost}</Text>
            <Ionicons name="diamond" size={8} color={Colors.gold} />
          </View>
        ) : null}
      </View>
      {section.body ? (
        <Text style={styles.cardBody}>{section.body}</Text>
      ) : null}
      {section.items?.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bullet}>·</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
      {section.contact ? (
        <View style={styles.contactBox}>
          <Ionicons name="mail-outline" size={14} color={Colors.gold} />
          <Text style={styles.contactText}>{section.contact}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

export default function GuideScreen() {
  const insets = useSafeAreaInsets();
  const topPad =
    typeof insets.top === "number" ? Math.max(insets.top, 8) : 44;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#08051A", "#070D1A", "#0D0820"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>İlk Üyeler Kılavuzu</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {GUIDE_SECTIONS.map((section, i) => (
          <GuideCard key={i} section={section} index={i} />
        ))}
        <Text style={styles.footer}>
          Tengri · Kadim Türk Mistisizmi · © 2026
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08051A" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gold + "20",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Lora_700Bold",
    color: Colors.gold,
    letterSpacing: 0.5,
  },

  scroll: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },

  card: {
    backgroundColor: "#0F082580",
    borderWidth: 1,
    borderColor: Colors.gold + "20",
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  cardHighlight: {
    backgroundColor: "#1A0F3580",
    borderColor: Colors.gold + "50",
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  cardIcon: { fontSize: 18 },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Lora_700Bold",
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  cardTitleHighlight: { color: Colors.gold },
  costBadge: {
    backgroundColor: Colors.gold + "20",
    borderWidth: 1,
    borderColor: Colors.gold + "40",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  costText: {
    fontSize: 11,
    fontFamily: "Lora_700Bold",
    color: Colors.gold,
  },
  cardBody: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  bullet: {
    fontSize: 16,
    color: Colors.gold,
    lineHeight: 20,
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Lora_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  contactBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    backgroundColor: "#1A0F3580",
    borderWidth: 1,
    borderColor: Colors.gold + "30",
    borderRadius: 10,
    padding: 12,
  },
  contactText: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
    color: Colors.gold,
  },
  footer: {
    fontSize: 10,
    fontFamily: "Lora_400Regular_Italic",
    color: Colors.textDim,
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 1,
  },
});
