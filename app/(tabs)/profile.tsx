import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Modal,
  Image,
  Alert,
  ActionSheetIOS,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { SERVICE_GOLD_COST } from "@/constants/serviceConfig";
import { getApiUrl } from "@/lib/query-client";

const GENDER_OPTIONS = [
  { value: "female",      labelTR: "Kadın",                 labelEN: "Female" },
  { value: "male",        labelTR: "Erkek",                 labelEN: "Male" },
  { value: "unspecified", labelTR: "Belirtmek istemiyorum", labelEN: "Prefer not to say" },
];

function genderLabel(gender: string | null, lang: string): string {
  if (!gender) return "";
  const opt = GENDER_OPTIONS.find(o => o.value === gender);
  if (!opt) return "";
  return lang === "tr" ? opt.labelTR : opt.labelEN;
}

function EditProfileModal({
  visible, lang, initialName, initialGender, initialBirthDate,
  onCancel, onSave,
}: {
  visible: boolean;
  lang: string;
  initialName: string;
  initialGender: string;
  initialBirthDate: string;
  onCancel: () => void;
  onSave: (data: { name: string; gender: string; birthDate: string }) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [gender, setGender] = useState(initialGender || "unspecified");
  const [birthDate, setBirthDate] = useState(initialBirthDate);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (visible) {
      setName(initialName);
      setGender(initialGender || "unspecified");
      setBirthDate(initialBirthDate);
      setSuccess(false);
      setError("");
    }
  }, [visible, initialName, initialGender, initialBirthDate]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError(lang === "tr" ? "Görünen ad boş bırakılamaz." : "Display name cannot be empty.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ name: name.trim(), gender, birthDate: birthDate.trim() });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onCancel(); }, 1200);
    } catch {
      setError(lang === "tr" ? "Kaydedilemedi. Tekrar deneyin." : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={editModal.overlay}>
        <View style={editModal.card}>
          <View style={editModal.titleRow}>
            <Ionicons name="person-outline" size={20} color={Colors.gold} />
            <Text style={editModal.title}>{lang === "tr" ? "Profili Düzenle" : "Edit Profile"}</Text>
          </View>

          <View style={editModal.field}>
            <Text style={editModal.label}>{lang === "tr" ? "Görünen Ad" : "Display Name"}</Text>
            <TextInput
              style={editModal.input}
              value={name}
              onChangeText={setName}
              placeholder={lang === "tr" ? "Adınızı girin" : "Enter your name"}
              placeholderTextColor="#5A4E7A"
              editable={!saving}
              maxLength={40}
            />
          </View>

          <View style={editModal.field}>
            <Text style={editModal.label}>{lang === "tr" ? "Cinsiyet" : "Gender"}</Text>
            <View style={editModal.genderRow}>
              {GENDER_OPTIONS.map(opt => (
                <Pressable
                  key={opt.value}
                  onPress={() => !saving && setGender(opt.value)}
                  style={[editModal.genderBtn, gender === opt.value && editModal.genderBtnActive]}
                >
                  <Text style={[editModal.genderBtnText, gender === opt.value && editModal.genderBtnTextActive]}>
                    {lang === "tr" ? opt.labelTR : opt.labelEN}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={editModal.field}>
            <Text style={editModal.label}>{lang === "tr" ? "Doğum Tarihi" : "Birth Date"}</Text>
            <TextInput
              style={editModal.input}
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="1990-01-15"
              placeholderTextColor="#5A4E7A"
              editable={!saving}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <Text style={editModal.hint}>YYYY-MM-DD</Text>
          </View>

          {error ? <Text style={editModal.errorText}>{error}</Text> : null}
          {success ? (
            <View style={editModal.successBanner}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF7A" />
              <Text style={editModal.successText}>{lang === "tr" ? "Kaydedildi!" : "Saved!"}</Text>
            </View>
          ) : null}

          <View style={editModal.btnRow}>
            <Pressable onPress={onCancel} style={editModal.cancelBtn} disabled={saving}>
              <Text style={editModal.cancelText}>{lang === "tr" ? "İptal" : "Cancel"}</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={[editModal.saveBtn, saving && { opacity: 0.5 }]}
              disabled={saving}
            >
              {saving
                ? <Text style={editModal.saveBtnText}>…</Text>
                : <>
                    <Ionicons name="checkmark" size={15} color={Colors.background} />
                    <Text style={editModal.saveBtnText}>{lang === "tr" ? "Kaydet" : "Save"}</Text>
                  </>
              }
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const SERVICE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  astroloji: "moon-outline", kahve: "cafe-outline", el: "hand-left-outline",
  tarot: "layers-outline", samanizm: "leaf-outline", numeroloji: "star-outline",
  ruh: "eye-outline", dogum: "planet-outline", ruya: "cloud-outline",
  burclar: "telescope-outline", ask: "heart-outline",
};
const SERVICE_COLORS: Record<string, string> = {
  astroloji: "#6B4FBB", kahve: "#C0932A", el: "#1ABFB8", tarot: "#E7B008",
  samanizm: "#4CAF7A", numeroloji: "#E74C8B", ruh: "#9B59B6",
  dogum: "#FF8C42", ruya: "#5B9BD5", burclar: "#FF6B9D", ask: "#FF4757",
};

const AVATAR_COLORS = [
  ["#6B4FBB", "#9B59B6"],
  ["#C0932A", "#E7B008"],
  ["#1ABFB8", "#5B9BD5"],
  ["#FF6B9D", "#FF4757"],
  ["#4CAF7A", "#1ABFB8"],
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColors(name: string): string[] {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function GoldCoin({ size = 32 }: { size?: number }) {
  const rotate = useSharedValue(0);
  React.useEffect(() => {
    rotate.value = withRepeat(
      withSequence(withTiming(15, { duration: 600 }), withTiming(-15, { duration: 600 })),
      -1, true
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));
  return (
    <Animated.View style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, style]}>
      <Text style={{ fontSize: size * 0.65 }}>✦</Text>
    </Animated.View>
  );
}

function DeleteConfirmModal({
  visible, lang, onCancel, onConfirm, loading,
}: {
  visible: boolean; lang: string; onCancel: () => void; onConfirm: (password: string) => void; loading: boolean;
}) {
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleCancel = () => { setPassword(""); onCancel(); };
  const handleConfirm = () => { if (password.trim()) onConfirm(password.trim()); };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleCancel}>
      <View style={modal.overlay}>
        <View style={modal.card}>
          <View style={modal.iconWrap}>
            <Ionicons name="warning-outline" size={32} color="#FF4444" />
          </View>
          <Text style={modal.title}>{lang === "tr" ? "Hesabı Sil" : "Delete Account"}</Text>
          <Text style={modal.body}>
            {lang === "tr"
              ? "Hesabınız ve tüm verileriniz kalıcı olarak silinecek.\nBu işlem geri alınamaz."
              : "Your account and all data will be permanently deleted.\nThis cannot be undone."}
          </Text>
          <View style={modal.passRow}>
            <TextInput
              style={modal.passInput}
              placeholder={lang === "tr" ? "Şifrenizi girin" : "Enter your password"}
              placeholderTextColor="#5A4E7A"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <Pressable onPress={() => setShowPass(v => !v)} style={modal.eyeBtn}>
              <Ionicons name={showPass ? "eye-outline" : "eye-off-outline"} size={18} color="#7A6EA0" />
            </Pressable>
          </View>
          <View style={modal.btnRow}>
            <Pressable onPress={handleCancel} style={modal.cancelBtn} disabled={loading}>
              <Text style={modal.cancelText}>{lang === "tr" ? "İptal" : "Cancel"}</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={[modal.deleteBtn, (loading || !password.trim()) && { opacity: 0.45 }]} disabled={loading || !password.trim()}>
              <Ionicons name="trash-outline" size={14} color="#fff" />
              <Text style={modal.deleteText}>{loading ? "…" : (lang === "tr" ? "Sil" : "Delete")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    goldBalance, readings, userProfile, clearUserProfile, totalSpent,
    profilePhotoUri, setProfilePhoto,
    mistikName, mistikBirthDate, mistikGender, updatePersonalInfo,
  } = useApp();
  const { t, lang } = useLang();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const recentReadings = readings.slice(0, 5);
  const serviceBreakdown = readings.reduce<Record<string, number>>((acc, r) => {
    acc[r.service] = (acc[r.service] ?? 0) + 1;
    return acc;
  }, {});
  const topService = Object.entries(serviceBreakdown).sort((a, b) => b[1] - a[1])[0];

  const avatarColors = userProfile ? getAvatarColors(userProfile.name) : [Colors.gold, "#C0932A"];
  const initials = userProfile ? getInitials(userProfile.name) : "?";

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await clearUserProfile();
    router.replace("/auth");
  };

  const handleDeleteConfirm = async (password: string) => {
    setDeleting(true);
    try {
      const apiBase = getApiUrl().replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/auth/delete-account`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userProfile?.email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        Alert.alert(lang === "tr" ? "Hata" : "Error", data?.error || (lang === "tr" ? "Şifre hatalı" : "Incorrect password"));
        setDeleting(false);
        return;
      }
      await clearUserProfile();
      setShowDeleteModal(false);
      router.replace("/auth");
    } catch {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const uriToDataUri = async (uri: string, base64: string | null | undefined): Promise<string | null> => {
    if (base64) return `data:image/jpeg;base64,${base64}`;
    if (Platform.OS === "web" && uri) {
      try {
        const res = await fetch(uri);
        const blob = await res.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch { return uri; }
    }
    return uri || null;
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        lang === "tr" ? "İzin Gerekli" : "Permission Required",
        lang === "tr" ? "Galeri erişimi için izin verin." : "Please allow gallery access."
      );
      return;
    }
    setPhotoLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const dataUri = await uriToDataUri(asset.uri, asset.base64);
        if (dataUri) await setProfilePhoto(dataUri);
      }
    } catch (e) {
      console.warn("[Profile] Gallery pick error:", e);
    } finally {
      setPhotoLoading(false);
    }
  };

  const pickFromCamera = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        lang === "tr" ? "Kamera Desteklenmiyor" : "Camera Not Supported",
        lang === "tr" ? "Web sürümünde kamera kullanılamaz. Galeriden fotoğraf seçin." : "Camera is not available on web. Please choose from gallery."
      );
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        lang === "tr" ? "İzin Gerekli" : "Permission Required",
        lang === "tr" ? "Kamera erişimi için izin verin." : "Please allow camera access."
      );
      return;
    }
    setPhotoLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const dataUri = await uriToDataUri(asset.uri, asset.base64);
        if (dataUri) await setProfilePhoto(dataUri);
      }
    } catch (e) {
      console.warn("[Profile] Camera pick error:", e);
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleAvatarPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS === "ios") {
      const opts = [
        lang === "tr" ? "Kameradan Çek" : "Take Photo",
        lang === "tr" ? "Galeriden Seç" : "Choose from Gallery",
        ...(profilePhotoUri ? [lang === "tr" ? "Fotoğrafı Kaldır" : "Remove Photo"] : []),
        lang === "tr" ? "İptal" : "Cancel",
      ];
      ActionSheetIOS.showActionSheetWithOptions(
        { options: opts, cancelButtonIndex: opts.length - 1, destructiveButtonIndex: profilePhotoUri ? 2 : undefined },
        (idx) => {
          if (idx === 0) pickFromCamera();
          else if (idx === 1) pickFromGallery();
          else if (idx === 2 && profilePhotoUri) setProfilePhoto(null);
        }
      );
    } else {
      const buttons: any[] = [];
      if (Platform.OS !== "web") {
        buttons.push({ text: lang === "tr" ? "Kameradan Çek" : "Take Photo", onPress: pickFromCamera });
      }
      buttons.push({ text: lang === "tr" ? "Galeriden Seç" : "Choose from Gallery", onPress: pickFromGallery });
      if (profilePhotoUri) {
        buttons.push({ text: lang === "tr" ? "Fotoğrafı Kaldır" : "Remove Photo", style: "destructive", onPress: () => setProfilePhoto(null) });
      }
      buttons.push({ text: lang === "tr" ? "İptal" : "Cancel", style: "cancel" });
      Alert.alert(
        lang === "tr" ? "Profil Fotoğrafı" : "Profile Photo",
        lang === "tr" ? "Bir seçenek belirleyin" : "Choose an option",
        buttons
      );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#08051A", "#070D1A", "#0D0820"]} style={StyleSheet.absoluteFill} />

      <DeleteConfirmModal
        visible={showDeleteModal}
        lang={lang}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />

      <EditProfileModal
        visible={showEditModal}
        lang={lang}
        initialName={mistikName ?? userProfile?.name ?? ""}
        initialGender={mistikGender ?? ""}
        initialBirthDate={mistikBirthDate ?? ""}
        onCancel={() => setShowEditModal(false)}
        onSave={updatePersonalInfo}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: botPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <Text style={styles.headerSub}>✦ TENGRI ✦</Text>
          <Text style={styles.headerTitle}>{lang === "tr" ? "Profilim" : "My Profile"}</Text>
        </Animated.View>

        {/* Avatar + User Info Card */}
        <Animated.View entering={ZoomIn.delay(100).springify()}>
          <LinearGradient
            colors={["#1A1030", "#0D1526"]}
            style={styles.profileCard}
          >
            {/* Avatar with edit button */}
            <Pressable onPress={handleAvatarPress} style={styles.avatarWrap} testID="avatar-press">
              {profilePhotoUri ? (
                <Image source={{ uri: profilePhotoUri }} style={styles.avatarImage} />
              ) : (
                <LinearGradient
                  colors={avatarColors as [string, string]}
                  style={styles.avatarInitials}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.initialsText}>{initials}</Text>
                </LinearGradient>
              )}
              {/* Edit overlay badge */}
              <View style={styles.editBadge}>
                <Ionicons name={photoLoading ? "hourglass-outline" : "camera"} size={13} color="#000" />
              </View>
            </Pressable>

            {/* User info */}
            <View style={styles.userInfoBlock}>
              {userProfile ? (
                <>
                  <Text style={styles.userName}>{userProfile.name}</Text>
                  <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={12} color={Colors.textDim} />
                    <Text style={styles.userEmail}>{userProfile.email}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={12} color={Colors.textDim} />
                    <Text style={styles.userJoin}>
                      {new Date(userProfile.joinDate).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </Text>
                  </View>
                  <Pressable onPress={handleAvatarPress} style={styles.changePhotoBtn}>
                    <Ionicons name="camera-outline" size={11} color={Colors.gold} />
                    <Text style={styles.changePhotoBtnText}>
                      {lang === "tr" ? (profilePhotoUri ? "Fotoğrafı Değiştir" : "Fotoğraf Ekle") : (profilePhotoUri ? "Change Photo" : "Add Photo")}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.userName}>{lang === "tr" ? "Misafir Kullanıcı" : "Guest User"}</Text>
                  <Pressable onPress={() => router.push("/auth")} style={styles.loginBtn}>
                    <Ionicons name="sparkles" size={13} color={Colors.background} />
                    <Text style={styles.loginBtnText}>{lang === "tr" ? "Giriş Yap / Kayıt Ol" : "Login / Register"}</Text>
                  </Pressable>
                </>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Personal Info Card */}
        {userProfile && (
          <Animated.View entering={FadeInDown.delay(130).springify()}>
            <LinearGradient colors={["#100C28", "#0A1020"]} style={styles.personalInfoCard}>
              <View style={styles.personalInfoHeader}>
                <Text style={styles.sectionTitle}>{lang === "tr" ? "✦ Kişisel Bilgiler" : "✦ Personal Info"}</Text>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowEditModal(true); }}
                  style={styles.editProfileBtn}
                  testID="edit-profile-btn"
                >
                  <Ionicons name="pencil-outline" size={13} color={Colors.gold} />
                  <Text style={styles.editProfileBtnText}>{lang === "tr" ? "Düzenle" : "Edit"}</Text>
                </Pressable>
              </View>

              <View style={styles.infoFieldRow}>
                <Ionicons name="person-outline" size={14} color={Colors.textDim} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoFieldLabel}>{lang === "tr" ? "Görünen Ad" : "Display Name"}</Text>
                  <Text style={styles.infoFieldValue}>
                    {mistikName || userProfile.name || (lang === "tr" ? "—" : "—")}
                  </Text>
                </View>
              </View>

              <View style={styles.infoFieldDivider} />

              <View style={styles.infoFieldRow}>
                <Ionicons name="mail-outline" size={14} color={Colors.textDim} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoFieldLabel}>{lang === "tr" ? "Giriş E-postası" : "Login Email"}</Text>
                  <Text style={styles.infoFieldValue} numberOfLines={1}>{userProfile.email}</Text>
                  <Text style={styles.infoFieldHint}>
                    {lang === "tr" ? "Giriş için kullanılan e-posta adresi değiştirilemez." : "The login email address cannot be changed."}
                  </Text>
                </View>
              </View>

              <View style={styles.infoFieldDivider} />

              <View style={styles.infoFieldRow}>
                <Ionicons name="male-female-outline" size={14} color={Colors.textDim} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoFieldLabel}>{lang === "tr" ? "Cinsiyet" : "Gender"}</Text>
                  <Text style={styles.infoFieldValue}>
                    {genderLabel(mistikGender, lang) || (lang === "tr" ? "—" : "—")}
                  </Text>
                </View>
              </View>

              <View style={styles.infoFieldDivider} />

              <View style={styles.infoFieldRow}>
                <Ionicons name="calendar-outline" size={14} color={Colors.textDim} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoFieldLabel}>{lang === "tr" ? "Doğum Tarihi" : "Birth Date"}</Text>
                  <Text style={styles.infoFieldValue}>
                    {mistikBirthDate || (lang === "tr" ? "—" : "—")}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Gold Balance */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.goldCard}>
          <LinearGradient colors={["#1A1205", "#0D1526"]} style={styles.goldCardInner}>
            <View style={styles.goldLeft}>
              <GoldCoin size={44} />
              <View style={{ gap: 3 }}>
                <Text style={styles.goldLabel}>{lang === "tr" ? "Altın Bakiyeniz" : "Gold Balance"}</Text>
                <Text style={styles.goldAmount}>{goldBalance} <Text style={styles.goldUnit}>{lang === "tr" ? "altın" : "gold"}</Text></Text>
              </View>
            </View>
            <Pressable onPress={() => router.push("/purchase")} style={styles.buyGoldBtn}>
              <Ionicons name="add" size={14} color={Colors.background} />
              <Text style={styles.buyGoldBtnText}>{lang === "tr" ? "Satın Al" : "Buy"}</Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: "#6B4FBB40" }]}>
            <LinearGradient colors={["#1A0F35", "#0D1526"]} style={styles.statCardInner}>
              <Ionicons name="book-outline" size={20} color="#6B4FBB" />
              <Text style={styles.statValue}>{readings.length}</Text>
              <Text style={styles.statLabel}>{lang === "tr" ? "Toplam Okuma" : "Total Readings"}</Text>
            </LinearGradient>
          </View>
          <View style={[styles.statCard, { borderColor: Colors.gold + "40" }]}>
            <LinearGradient colors={["#1A1205", "#0D1526"]} style={styles.statCardInner}>
              <Ionicons name="star" size={20} color={Colors.gold} />
              <Text style={styles.statValue}>{totalSpent}</Text>
              <Text style={styles.statLabel}>{lang === "tr" ? "Harcanan Altın" : "Gold Spent"}</Text>
            </LinearGradient>
          </View>
          <View style={[styles.statCard, { borderColor: "#FF6B9D40" }]}>
            <LinearGradient colors={["#1A0515", "#0D1526"]} style={styles.statCardInner}>
              <Ionicons name={topService ? (SERVICE_ICONS[topService[0]] ?? "sparkles") : "sparkles"} size={20} color="#FF6B9D" />
              <Text style={styles.statValue} numberOfLines={1}>{topService ? topService[1] : 0}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                {lang === "tr" ? "En Çok Kullanılan" : "Most Used"}
              </Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Service Costs Reference */}
        <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>
            {lang === "tr" ? "✦ Hizmet Ücretleri" : "✦ Service Costs"}
          </Text>
          <View style={styles.costGrid}>
            {Object.entries(SERVICE_GOLD_COST).sort((a, b) => a[1] - b[1]).map(([svc, cost]) => (
              <View key={svc} style={[styles.costItem, { borderColor: (SERVICE_COLORS[svc] ?? Colors.gold) + "30" }]}>
                <Ionicons name={SERVICE_ICONS[svc] ?? "star-outline"} size={16} color={SERVICE_COLORS[svc] ?? Colors.gold} />
                <Text style={styles.costItemName} numberOfLines={1}>
                  {(t.services_list as any)[svc]?.label ?? svc}
                </Text>
                <View style={styles.costBadge}>
                  <Text style={styles.costBadgeText}>{cost}✦</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Recent Readings */}
        {recentReadings.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>{lang === "tr" ? "✦ Son Okumalar" : "✦ Recent Readings"}</Text>
              <Pressable onPress={() => router.push("/(tabs)/history")}>
                <Text style={styles.seeAll}>{lang === "tr" ? "Tümü →" : "All →"}</Text>
              </Pressable>
            </View>
            {recentReadings.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/(tabs)/history");
                }}
                style={({ pressed }) => [
                  styles.recentCard,
                  { borderColor: (SERVICE_COLORS[r.service] ?? Colors.gold) + "25" },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <View style={[styles.recentIcon, { borderColor: (SERVICE_COLORS[r.service] ?? Colors.gold) + "40" }]}>
                  <Ionicons name={SERVICE_ICONS[r.service] ?? "star-outline"} size={16} color={SERVICE_COLORS[r.service] ?? Colors.gold} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.recentService}>{r.serviceLabel}</Text>
                  <Text style={styles.recentText} numberOfLines={2}>{r.content.slice(0, 80)}…</Text>
                </View>
                {r.goldSpent && (
                  <Text style={styles.recentGold}>{r.goldSpent}✦</Text>
                )}
              </Pressable>
            ))}
          </Animated.View>
        )}

        {/* Account Actions */}
        <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>{lang === "tr" ? "✦ Hesap" : "✦ Account"}</Text>
          <Pressable onPress={() => router.push("/purchase")} style={styles.actionBtn}>
            <LinearGradient colors={["#1A1205", "#0D1526"]} style={styles.actionBtnInner}>
              <Ionicons name="diamond-outline" size={18} color={Colors.gold} />
              <Text style={styles.actionBtnText}>{lang === "tr" ? "Altın Satın Al" : "Buy Gold"}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
            </LinearGradient>
          </Pressable>
          {userProfile && (
            <>
              <Pressable onPress={handleLogout} style={styles.logoutBtn}>
                <Ionicons name="log-out-outline" size={16} color={Colors.error} />
                <Text style={styles.logoutText}>{lang === "tr" ? "Çıkış Yap" : "Logout"}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowDeleteModal(true);
                }}
                style={styles.deleteAccBtn}
              >
                <Ionicons name="trash-outline" size={15} color="#FF4444" />
                <Text style={styles.deleteBtnText}>{lang === "tr" ? "Hesabımı Sil" : "Delete My Account"}</Text>
              </Pressable>
            </>
          )}
        </Animated.View>

        {/* Legal Links */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>{lang === "tr" ? "✦ Yasal" : "✦ Legal"}</Text>
          <Pressable
            onPress={() => router.push("/legal?doc=privacy" as any)}
            style={styles.actionBtn}
          >
            <LinearGradient colors={["#0D0820", "#0A0D1A"]} style={styles.actionBtnInner}>
              <Ionicons name="shield-checkmark-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.actionBtnText}>{lang === "tr" ? "Gizlilik Politikası" : "Privacy Policy"}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={() => router.push("/legal?doc=terms" as any)}
            style={styles.actionBtn}
          >
            <LinearGradient colors={["#0D0820", "#0A0D1A"]} style={styles.actionBtnInner}>
              <Ionicons name="document-text-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.actionBtnText}>{lang === "tr" ? "Kullanım Koşulları" : "Terms of Use"}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
            </LinearGradient>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 18, gap: 14 },

  header: { alignItems: "center", marginBottom: 4, gap: 4 },
  headerSub: { fontSize: 10, fontFamily: "Lora_400Regular", color: Colors.gold, letterSpacing: 6, textAlign: "center" },
  headerTitle: { fontSize: 26, fontFamily: "Lora_700Bold", color: Colors.text, textAlign: "center" },

  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },

  avatarWrap: { position: "relative" },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.gold + "60",
  },
  avatarInitials: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.gold + "30",
  },
  initialsText: {
    fontFamily: "Lora_700Bold",
    fontSize: 28,
    color: "#fff",
    letterSpacing: 2,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.background,
  },

  userInfoBlock: { flex: 1, gap: 5 },
  userName: { fontSize: 17, fontFamily: "Lora_700Bold", color: Colors.text, lineHeight: 22 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  userEmail: { fontSize: 12, fontFamily: "Lora_400Regular", color: Colors.textSecondary, flex: 1 },
  userJoin: { fontSize: 11, fontFamily: "Lora_400Regular_Italic", color: Colors.textDim },
  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
    alignSelf: "flex-start",
    backgroundColor: Colors.gold + "10",
  },
  changePhotoBtnText: {
    fontSize: 11,
    fontFamily: "Lora_700Bold",
    color: Colors.gold,
  },
  loginBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.gold, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, alignSelf: "flex-start", marginTop: 4,
  },
  loginBtnText: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.background },

  goldCard: { borderRadius: 16, borderWidth: 1, borderColor: Colors.gold + "30", overflow: "hidden" },
  goldCardInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  goldLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  goldLabel: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textSecondary },
  goldAmount: { fontSize: 22, fontFamily: "Lora_700Bold", color: Colors.gold },
  goldUnit: { fontSize: 13, fontFamily: "Lora_400Regular", color: Colors.gold + "90" },
  buyGoldBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.gold, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  buyGoldBtnText: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.background },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  statCardInner: { padding: 14, alignItems: "center", gap: 6 },
  statValue: { fontSize: 20, fontFamily: "Lora_700Bold", color: Colors.text },
  statLabel: { fontSize: 10, fontFamily: "Lora_400Regular", color: Colors.textSecondary, textAlign: "center" },

  section: { gap: 10 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.gold, letterSpacing: 1 },
  seeAll: { fontSize: 12, fontFamily: "Lora_400Regular", color: Colors.textSecondary },

  costGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  costItem: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: Colors.surface, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  costItemName: { fontSize: 11, fontFamily: "Lora_400Regular", color: Colors.textSecondary, flex: 1, maxWidth: 80 },
  costBadge: { backgroundColor: Colors.gold + "20", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  costBadgeText: { fontSize: 10, fontFamily: "Lora_700Bold", color: Colors.gold },

  recentCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, padding: 12 },
  recentIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceElevated, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  recentService: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.text },
  recentText: { fontSize: 11, fontFamily: "Lora_400Regular_Italic", color: Colors.textSecondary, lineHeight: 16 },
  recentGold: { fontSize: 11, fontFamily: "Lora_700Bold", color: Colors.gold },

  actionBtn: { borderRadius: 14, borderWidth: 1, borderColor: Colors.gold + "30", overflow: "hidden" },
  actionBtnInner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  actionBtnText: { flex: 1, fontSize: 14, fontFamily: "Lora_700Bold", color: Colors.text },

  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.error + "30", backgroundColor: Colors.surface },
  logoutText: { fontSize: 14, fontFamily: "Lora_700Bold", color: Colors.error },
  deleteAccBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: "#FF444420", backgroundColor: "transparent" },
  deleteBtnText: { fontSize: 12, fontFamily: "Lora_400Regular", color: "#FF4444" },

  personalInfoCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 18,
    gap: 12,
  },
  personalInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
    backgroundColor: Colors.gold + "12",
  },
  editProfileBtnText: {
    fontSize: 11,
    fontFamily: "Lora_700Bold",
    color: Colors.gold,
  },
  infoFieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoFieldLabel: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
    color: Colors.textDim,
    marginBottom: 2,
  },
  infoFieldValue: {
    fontSize: 14,
    fontFamily: "Lora_700Bold",
    color: Colors.text,
  },
  infoFieldHint: {
    fontSize: 10,
    fontFamily: "Lora_400Regular_Italic",
    color: Colors.textDim,
    marginTop: 3,
    lineHeight: 14,
  },
  infoFieldDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: 2,
  },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", alignItems: "center", justifyContent: "center", padding: 32 },
  card: { backgroundColor: "#0F0B22", borderRadius: 20, borderWidth: 1, borderColor: "#FF444430", padding: 28, width: "100%", maxWidth: 360, alignItems: "center", gap: 14 },
  iconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#FF444415", borderWidth: 1, borderColor: "#FF444440", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Lora_700Bold", color: "#FF6666", textAlign: "center" },
  body: { fontSize: 13, fontFamily: "Lora_400Regular", color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
  passRow: { flexDirection: "row", alignItems: "center", width: "100%", backgroundColor: "#1A1435", borderRadius: 12, borderWidth: 1, borderColor: "#3A2F5A", paddingHorizontal: 14 },
  passInput: { flex: 1, paddingVertical: 13, fontSize: 14, fontFamily: "Lora_400Regular", color: Colors.text },
  eyeBtn: { padding: 6 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 4, width: "100%" },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, backgroundColor: Colors.surface, alignItems: "center" },
  cancelText: { fontSize: 14, fontFamily: "Lora_700Bold", color: Colors.text },
  deleteBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 12, backgroundColor: "#CC2222" },
  deleteText: { fontSize: 14, fontFamily: "Lora_700Bold", color: "#fff" },
});

const editModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.80)", justifyContent: "flex-end" },
  card: {
    backgroundColor: "#0F0B22",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
    padding: 28,
    paddingBottom: 40,
    gap: 18,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 18, fontFamily: "Lora_700Bold", color: Colors.text },
  field: { gap: 8 },
  label: { fontSize: 12, fontFamily: "Lora_700Bold", color: Colors.gold, letterSpacing: 0.5 },
  input: {
    backgroundColor: "#1A1435",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3A2F5A",
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    color: Colors.text,
  },
  hint: { fontSize: 10, fontFamily: "Lora_400Regular_Italic", color: Colors.textDim },
  genderRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  genderBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3A2F5A",
    backgroundColor: "#1A1435",
  },
  genderBtnActive: {
    borderColor: Colors.gold + "80",
    backgroundColor: Colors.gold + "18",
  },
  genderBtnText: { fontSize: 12, fontFamily: "Lora_400Regular", color: Colors.textSecondary },
  genderBtnTextActive: { fontFamily: "Lora_700Bold", color: Colors.gold },
  errorText: { fontSize: 12, fontFamily: "Lora_400Regular", color: "#FF6666", textAlign: "center" },
  successBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#4CAF7A18", borderRadius: 10, borderWidth: 1, borderColor: "#4CAF7A40", paddingVertical: 10, paddingHorizontal: 14 },
  successText: { fontSize: 13, fontFamily: "Lora_700Bold", color: "#4CAF7A" },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, backgroundColor: Colors.surface, alignItems: "center" },
  cancelText: { fontSize: 14, fontFamily: "Lora_700Bold", color: Colors.text },
  saveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.gold },
  saveBtnText: { fontSize: 14, fontFamily: "Lora_700Bold", color: Colors.background },
});
