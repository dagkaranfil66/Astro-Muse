import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Colors } from "@/constants/colors";

const PRIVACY_SECTIONS = [
  {
    title: "Genel Bakış",
    body: 'Tengri ("biz", "uygulama") olarak kullanıcılarımızın gizliliğine büyük önem veriyoruz. Bu politika, uygulamayı kullandığınızda hangi verileri topladığımızı, nasıl kullandığımızı ve koruduğumuzu açıklar.',
  },
  {
    title: "Topladığımız Veriler",
    items: [
      "Ad ve E-posta adresi — Hesap oluşturma ve iletişim için",
      "Uygulama kullanım verileri — Hizmet kullanımı, okuma geçmişi",
      "Satın alma bilgileri — RevenueCat aracılığıyla in-app satın alma kayıtları (kart bilgileri tarafımızda saklanmaz)",
      "Yüklenen görseller — Kahve analizi veya el çizgisi analizi için gönderilen fotoğraflar (yalnızca analiz için kullanılır, saklanmaz)",
    ],
  },
  {
    title: "Verileri Nasıl Kullanıyoruz",
    items: [
      "Hesabınızı oluşturmak ve yönetmek",
      "Yapay zeka destekli mistik rehberlik hizmetleri sunmak",
      "Altın bakiyenizi ve satın alımlarınızı takip etmek",
      "Hesap doğrulama ve şifre sıfırlama e-postaları göndermek",
      "Hizmet kalitesini iyileştirmek",
    ],
  },
  {
    title: "Üçüncü Taraf Hizmetler",
    body: "Tengri aşağıdaki güvenilir üçüncü taraf hizmetlerini kullanır:",
    items: [
      "OpenAI — Yapay zeka ile mistik yorumlar üretmek için",
      "RevenueCat — App Store ve Google Play üzerinden in-app satın alma işlemleri",
      "Resend — İşlemsel e-postalar (doğrulama, şifre sıfırlama)",
    ],
    footer: "Bu hizmetlerin kendi gizlilik politikaları mevcuttur. Yüklediğiniz görseller yalnızca analize gönderilir ve üçüncü taraflarca saklanmaz.",
  },
  {
    title: "Veri Güvenliği",
    body: "Şifreleriniz bcrypt ile şifrelenerek saklanır. Tüm bağlantılar HTTPS üzerinden şifrelenir. Ödeme bilgilerinizi biz tutmayız; Apple App Store veya Google Play üzerinden güvenli biçimde işlenir.",
  },
  {
    title: "Çocukların Gizliliği",
    body: "Tengri, 13 yaşın altındaki çocuklara yönelik değildir ve bilerek bu yaş grubundan veri toplamaz. 13 yaş altı bir kullanıcı verisi topladığımızı fark edersek bu verileri derhal sileriz.",
  },
  {
    title: "Hesap Silme ve Veri Talebi",
    body: "Hesabınızı ve tüm verilerinizi kalıcı olarak silmek için:",
    items: [
      "Uygulama içi: Profil → Hesabımı Sil",
      "E-posta ile: tengri@tengristar.com",
    ],
    footer: "Silme talebiniz en geç 30 gün içinde işleme alınır.",
  },
  {
    title: "Politika Değişiklikleri",
    body: "Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişikliklerde e-posta bildirimi göndeririz. Güncel politika her zaman uygulama içinde erişilebilir olacaktır.",
  },
  {
    title: "İletişim",
    body: "Gizlilik ile ilgili sorularınız için:",
    contact: "tengri@tengristar.com",
  },
];

const TERMS_SECTIONS = [
  {
    title: "Kabul",
    body: "Tengri uygulamasını kullanarak bu Kullanım Koşulları'nı kabul etmiş sayılırsınız. Koşulları kabul etmiyorsanız lütfen uygulamayı kullanmayın.",
  },
  {
    title: "Hizmet Tanımı",
    body: "Tengri, yapay zeka destekli mistik rehberlik hizmetleri sunan bir mobil uygulamadır. Kahve analizi, tarot, astroloji, rüya yorumu ve diğer hizmetler eğlence ve kişisel yansıma amaçlıdır; bilimsel veya kehanet niteliği taşımaz.",
  },
  {
    title: "Hesap ve Güvenlik",
    items: [
      "Hesap bilgilerinizin gizliliğini korumakla yükümlüsünüz",
      "Hesabınızla gerçekleştirilen tüm işlemlerden siz sorumlusunuz",
      "Başkasına ait bilgilerle hesap açılamaz",
      "Şüpheli bir durumda derhal tengri@tengristar.com'a bildirin",
    ],
  },
  {
    title: "Altın Sistemi ve Satın Almalar",
    items: [
      "Altınlar, uygulama içi hizmetlerde kullanılan sanal birimdir; para iadesi yapılmaz",
      "In-app satın almalar Apple App Store veya Google Play Store üzerinden gerçekleşir",
      "Günlük çark ile ücretsiz altın kazanılabilir",
      "Hesap silindiğinde altın bakiyesi kalıcı olarak silinir",
    ],
  },
  {
    title: "Kullanım Kuralları",
    body: "Aşağıdaki davranışlar kesinlikle yasaktır:",
    items: [
      "Uygulamayı veya API'yi kötüye kullanmak",
      "Başkalarının hesabına erişmeye çalışmak",
      "Uygunsuz, zarar verici veya yasadışı içerik göndermek",
      "Uygulamayı tersine mühendislik veya kopyalamaya çalışmak",
    ],
  },
  {
    title: "Fikri Mülkiyet",
    body: "Tengri uygulaması, içeriği, tasarımı ve kodu tamamen Tengri'ye aittir. Kullanıcı tarafından yüklenen görseller analiz için kullanılır ve analiz sonrası silinir.",
  },
  {
    title: "Sorumluluk Sınırı",
    body: "Tengri mistik rehberlik hizmetleri eğlence amaçlıdır. Herhangi bir kararınızı yalnızca uygulama yorumlarına dayandırmanızı önermeyiz. Tengri, bu yorumlara dayanarak alınan kararların sonuçlarından sorumlu tutulamaz.",
  },
  {
    title: "Hizmet Kesintileri",
    body: "Planlı bakım veya teknik nedenlerle hizmet geçici olarak kesilebilir. Bu sürelerde altın tüketimi gerçekleşmez.",
  },
  {
    title: "Değişiklikler",
    body: "Bu Kullanım Koşulları'nı önceden bildirimde bulunmaksızın güncelleyebiliriz. Önemli değişiklikler e-posta ile bildirilir.",
  },
  {
    title: "İletişim",
    body: "Sorularınız için:",
    contact: "tengri@tengristar.com",
  },
];

function Section({
  section,
  index,
}: {
  section: (typeof PRIVACY_SECTIONS)[0] | (typeof TERMS_SECTIONS)[0];
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={styles.card}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 0 }}>
        <Ionicons name="sparkles" size={11} color={Colors.gold} />
        <Text style={styles.cardTitle}>{section.title}</Text>
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
      {('footer' in section) && section.footer ? (
        <Text style={[styles.cardBody, { marginTop: 8 }]}>
          {section.footer}
        </Text>
      ) : null}
      {section.contact ? (
        <Pressable
          onPress={() => Linking.openURL(`mailto:${section.contact}`)}
          style={styles.contactBox}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="sparkles" size={10} color={Colors.gold} />
            <Text style={styles.contactText}>{section.contact}</Text>
            <Ionicons name="sparkles" size={10} color={Colors.gold} />
          </View>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ doc?: string }>();
  const [tab, setTab] = useState<"privacy" | "terms">(
    params.doc === "terms" ? "terms" : "privacy"
  );

  const sections = tab === "privacy" ? PRIVACY_SECTIONS : TERMS_SECTIONS;
  const title = tab === "privacy" ? "Gizlilik Politikası" : "Kullanım Koşulları";

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
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab switcher */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === "privacy" && styles.tabActive]}
          onPress={() => setTab("privacy")}
        >
          <Text style={[styles.tabText, tab === "privacy" && styles.tabTextActive]}>
            Gizlilik
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "terms" && styles.tabActive]}
          onPress={() => setTab("terms")}
        >
          <Text style={[styles.tabText, tab === "terms" && styles.tabTextActive]}>
            Kullanım Koşulları
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.meta}>Son güncelleme: Mart 2026 · tengristar.com</Text>
        {sections.map((section, i) => (
          <Section key={i} section={section} index={i} />
        ))}
        <Text style={styles.footer}>
          tengristar.com · Kadim Türk Mistisizmi · © 2026 Tengri
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

  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: Colors.card + "80",
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: Colors.gold + "25",
    borderWidth: 1,
    borderColor: Colors.gold + "40",
  },
  tabText: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    color: Colors.textDim,
  },
  tabTextActive: {
    color: Colors.gold,
    fontFamily: "Lora_700Bold",
  },

  scroll: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  meta: {
    fontSize: 11,
    fontFamily: "Lora_400Regular_Italic",
    color: Colors.textDim,
    marginBottom: 4,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#0F082580",
    borderWidth: 1,
    borderColor: Colors.gold + "20",
    borderRadius: 14,
    padding: 18,
    gap: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: "Lora_700Bold",
    color: Colors.gold,
    letterSpacing: 0.8,
    marginBottom: 4,
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
    marginTop: 6,
    backgroundColor: "#1A0F3580",
    borderWidth: 1,
    borderColor: Colors.gold + "30",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  contactText: {
    fontSize: 13,
    fontFamily: "Lora_700Bold",
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
