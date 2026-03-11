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

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={Colors.gold} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: "Lora_700Bold" }]}>Kullanım Koşulları</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.updated, { fontFamily: "Lora_400Regular" }]}>Son güncelleme: Mart 2025</Text>

        <Section title="1. Kabul">
          Tengri uygulamasını ("Uygulama") kullanarak bu Kullanım Koşullarını okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan edersiniz. Koşulları kabul etmiyorsanız uygulamayı kullanmayınız.
        </Section>

        <Section title="2. Hizmet Tanımı">
          Tengri; kahve falı, tarot, astroloji, numeroloji, rüya yorumu ve diğer mistik okuma hizmetlerini yapay zekâ teknolojisi aracılığıyla sunan bir eğlence uygulamasıdır.
        </Section>

        <Section title="3. Eğlence Amaçlı Kullanım">
          Uygulamamızda sunulan tüm okumalar ve yorumlar yalnızca eğlence amaçlıdır. Bu içerikler:{"\n\n"}
          • Tıbbi, hukuki veya finansal tavsiye niteliği taşımaz{"\n"}
          • Geleceği kesin olarak öngöremez{"\n"}
          • Profesyonel danışmanlık hizmetlerinin yerine geçmez{"\n\n"}
          Okuma sonuçlarına dayanarak alınan kararların sorumluluğu kullanıcıya aittir.
        </Section>

        <Section title="4. Hesap Sorumluluğu">
          • Hesap bilgilerinizin gizliliğini korumak sizin sorumluluğunuzdadır{"\n"}
          • Hesabınız üzerinden gerçekleştirilen tüm işlemlerden siz sorumlusunuz{"\n"}
          • Hesabınızın yetkisiz kullanımını fark ettiğinizde bizi derhal bilgilendirmelisiniz
        </Section>

        <Section title="5. Altın Sistemi ve Satın Almalar">
          Uygulama içi altın (✦) sistemi ve satın alımlar şu kurallara tabidir:{"\n\n"}
          • Satın alınan altınlar iade edilemez{"\n"}
          • Altınların nakit değeri bulunmamaktadır{"\n"}
          • Uygulama içi fiyatlar önceden bildirim yapılmaksızın değiştirilebilir{"\n"}
          • Abonelik iptalleri App Store veya Google Play üzerinden yapılır
        </Section>

        <Section title="6. Yaş Sınırı">
          Uygulamamız 13 yaş ve üzeri kullanıcılara yöneliktir. 13 yaşın altındaysanız uygulamayı kullanamazsınız. Bazı ücretli içerikler için 18 yaş şartı aranabilir.
        </Section>

        <Section title="7. Kullanım Kuralları">
          Aşağıdaki davranışlar kesinlikle yasaktır:{"\n\n"}
          • Uygulamanın kötüye kullanımı veya kötü amaçlı yazılım yüklenmesi{"\n"}
          • Başka kullanıcıların hesaplarına yetkisiz erişim girişimi{"\n"}
          • Uygulama içeriğinin izinsiz kopyalanması veya dağıtılması{"\n"}
          • Sistemleri aşmaya yönelik tersine mühendislik girişimleri
        </Section>

        <Section title="8. Fikri Mülkiyet">
          Tengri logosu, tasarımı, içerikleri ve yazılımı telif hakkı yasalarıyla korunmaktadır. Tüm haklar saklıdır. Önceden yazılı izin alınmadan ticari amaçla kullanılamaz.
        </Section>

        <Section title="9. Sorumluluk Sınırlaması">
          Tengri; okuma sonuçlarından kaynaklanabilecek dolaylı, tesadüfi veya sonuç olarak ortaya çıkan zararlardan sorumlu tutulamaz. Hizmet "olduğu gibi" sunulmaktadır.
        </Section>

        <Section title="10. Koşul Değişiklikleri">
          Bu koşulları dilediğimiz zaman güncelleyebiliriz. Güncellemeler uygulamada yayınlandığı andan itibaren geçerli olur. Uygulamayı kullanmaya devam etmeniz değişiklikleri kabul ettiğiniz anlamına gelir.
        </Section>

        <Section title="11. İletişim">
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
