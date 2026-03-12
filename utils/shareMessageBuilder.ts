import { SHARE_CONFIG } from '@/constants/shareConfig';
import { referralService } from '@/services/referralService';

// ─── Share Message Builder ────────────────────────────────────────────────────
// Builds localised share messages with optional referral code embedding.

export interface ShareMessageOptions {
  serviceName: string;
  referralCode?: string;
  lang?: 'tr' | 'en';
}

export function buildShareMessage({
  serviceName,
  referralCode,
  lang = 'tr',
}: ShareMessageOptions): string {
  const refLink = referralCode
    ? `${SHARE_CONFIG.REFERRAL_BASE_URL}${referralCode}`
    : SHARE_CONFIG.APP_STORE_URL;

  const refSuffix = referralCode
    ? lang === 'tr'
      ? `\n\n🎁 Davet kodum: ${referralCode}\n(Seni davet ettiğimde ikiniz de +${referralService.REFERRAL_GOLD} altın kazanırsınız!)`
      : `\n\n🎁 My invite code: ${referralCode}\n(We both earn +${referralService.REFERRAL_GOLD} gold!)`
    : '';

  if (lang === 'en') {
    return `✦ I just got a mystical ${serviceName} reading on Tengri!\n\nAI-powered fortune telling & cosmic guidance:\n${refLink}${refSuffix}`;
  }

  return `✦ Tengri'de ${serviceName} yaptırdım — kadim mistik rehberlik!\n\nYıldızlar seni çağırıyor:\n${refLink}${refSuffix}`;
}

export function buildReferralInvite(referralCode: string, lang: 'tr' | 'en' = 'tr'): string {
  const link = `${SHARE_CONFIG.REFERRAL_BASE_URL}${referralCode}`;
  if (lang === 'en') {
    return `✨ Join me on Tengri — mystical AI-powered fortune telling!\n\nUse my invite code and we both earn +${referralService.REFERRAL_GOLD} gold 🎁\n\nCode: ${referralCode}\n${link}`;
  }
  return `✨ Tengri'ye katıl — AI destekli mistik rehberlik!\n\nDavet kodum ile kayıt ol, ikiniz de +${referralService.REFERRAL_GOLD} altın kazan 🎁\n\nKod: ${referralCode}\n${link}`;
}

export function buildReadingTeaser(serviceName: string, snippet: string, lang: 'tr' | 'en' = 'tr'): string {
  const app = SHARE_CONFIG.APP_STORE_URL;
  if (lang === 'en') {
    return `🔮 My ${serviceName} reading:\n\n"${snippet.slice(0, 120)}..."\n\nGet yours on Tengri: ${app}`;
  }
  return `🔮 ${serviceName} falımdan:\n\n"${snippet.slice(0, 120)}..."\n\nSen de Tengri'de baktır: ${app}`;
}
