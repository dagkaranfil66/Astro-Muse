import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useLang } from "@/context/LanguageContext";

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const { lang } = useLang();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={Colors.gold} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: "Lora_700Bold" }]}>
          {lang === "tr" ? "Gizlilik Politikası" : "Privacy Policy"}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.updated, { fontFamily: "Lora_400Regular" }]}>Son güncelleme: Mart 2025</Text>

        <Section title="1. Genel Bakış">
          Tengri uygulaması ("Uygulama"), kullanıcılarına eğlence amaçlı mistik rehberlik hizmetleri sunar. Bu Gizlilik Politikası, kişisel verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.
        </Section>

        <Section title="2. Toplanan Veriler">
          Uygulama aşağıdaki verileri toplayabilir:{"\n\n"}
          • Hesap oluşturma sırasında sağladığınız ad, e-posta adresi{"\n"}
          • Uygulama içi okuma geçmişiniz ve tercihleriniz{"\n"}
          • Yüklediğiniz fotoğraflar (kahve fincanı, el çizgisi analizi vb.){"\n"}
          • Cihaz bilgileri ve uygulama kullanım istatistikleri{"\n"}
          • Satın alma işlemleri (RevenueCat aracılığıyla)
        </Section>

        <Section title="3. Verilerin Kullanımı">
          Toplanan veriler şu amaçlarla kullanılır:{"\n\n"}
          • Yapay zekâ destekli mistik okuma hizmetlerini sunmak{"\n"}
          • Okuma geçmişinizi kaydetmek ve size göstermek{"\n"}
          • Hesabınızı yönetmek ve güvenliğini sağlamak{"\n"}
          • Uygulama performansını iyileştirmek
        </Section>

        <Section title="4. Fotoğraf ve Görsel Veriler">
          Uygulamaya yüklediğiniz fotoğraflar yalnızca yapay zekâ analizi amacıyla işlenir. Fotoğraflarınız üçüncü taraflarla paylaşılmaz ve analiz tamamlandıktan sonra sunucularımızda kalıcı olarak saklanmaz.
        </Section>

        <Section title="5. Üçüncü Taraf Hizmetler">
          Uygulama aşağıdaki üçüncü taraf hizmetleri kullanır:{"\n\n"}
          • OpenAI – Yapay zekâ okuma hizmetleri{"\n"}
          • RevenueCat – Abonelik ve satın alma yönetimi{"\n"}
          • Resend – E-posta bildirimleri{"\n\n"}
          Bu hizmetlerin kendi gizlilik politikaları geçerlidir.
        </Section>

        <Section title="6. Veri Güvenliği">
          Kişisel verileriniz endüstri standardı şifreleme yöntemleriyle korunur. Ancak internet üzerinden hiçbir veri iletiminin %100 güvenli olmadığını belirtmek isteriz.
        </Section>

        <Section title="7. Çocukların Gizliliği">
          Uygulamamız 13 yaşın altındaki çocuklara yönelik değildir. Bilerek 13 yaş altı çocuklara ait kişisel veri toplamayız.
        </Section>

        <Section title="8. Haklarınız">
          Kişisel verilerinize erişim, düzeltme veya silme talebinde bulunmak için{" "}
          <Text style={styles.emailLink}>tengri@tengristar.com</Text>{" "}
          adresine e-posta gönderebilirsiniz.
        </Section>

        <Section title="9. Politika Değişiklikleri">
          Bu politikayı zaman zaman güncelleyebiliriz. Önemli değişiklikler olduğunda uygulama içi bildirim yoluyla sizi bilgilendireceğiz.
        </Section>

        <Section title="10. İletişim">
          Sorularınız için:{"\n"}
          E-posta: tengri@tengristar.com{"\n"}
          Web: tengristar.com
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontFamily: "Lora_700Bold" }]}>{title}</Text>
      <Text style={[styles.sectionBody, { fontFamily: "Lora_400Regular" }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08051A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gold + "20",
  },
  backBtn: { padding: 4, width: 40 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, color: Colors.text, letterSpacing: 0.5 },
  headerRight: { width: 40 },
  content: { paddingHorizontal: 24, paddingTop: 24 },
  updated: { fontSize: 12, color: Colors.textDim, marginBottom: 24, textAlign: "center" },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 15, color: Colors.gold, marginBottom: 8, letterSpacing: 0.3 },
  sectionBody: { fontSize: 14, color: Colors.textSecondary, lineHeight: 24 },
  emailLink: { color: Colors.gold, textDecorationLine: "underline" },
});
