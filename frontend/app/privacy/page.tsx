'use client';

import { LegalPage } from '@/components/legal/LegalPage';
import { useLanguageStore } from '@/lib/store/useLanguageStore';

export default function PrivacyPage() {
  const t = useLanguageStore((s) => s.t);
  return (
    <LegalPage
      title={t('privacy_title')}
      updated={t('privacy_updated')}
      intro={t('privacy_intro')}
      sections={[
        {
          heading: t('privacy_s1_h'),
          items: [
            t('privacy_s1_i1'),
            t('privacy_s1_i2'),
            t('privacy_s1_i3'),
            t('privacy_s1_i4'),
            t('privacy_s1_i5'),
            t('privacy_s1_i6'),
            t('privacy_s1_i7'),
          ],
        },
        {
          heading: t('privacy_s2_h'),
          items: [
            t('privacy_s2_i1'),
            t('privacy_s2_i2'),
            t('privacy_s2_i3'),
            t('privacy_s2_i4'),
            t('privacy_s2_i5'),
            t('privacy_s2_i6'),
          ],
        },
        {
          heading: t('privacy_s3_h'),
          body: t('privacy_s3_b'),
        },
        {
          heading: t('privacy_s4_h'),
          body: t('privacy_s4_b'),
        },
        {
          heading: t('privacy_s5_h'),
          items: [t('privacy_s5_i1'), t('privacy_s5_i2'), t('privacy_s5_i3')],
        },
        {
          heading: t('privacy_s6_h'),
          body: t('privacy_s6_b'),
        },
        {
          heading: t('privacy_s7_h'),
          items: [
            t('privacy_s7_i1'),
            t('privacy_s7_i2'),
            t('privacy_s7_i3'),
            t('privacy_s7_i4'),
          ],
        },
        {
          heading: t('privacy_s8_h'),
          body: t('privacy_s8_b'),
        },
        {
          heading: t('privacy_s9_h'),
          items: [
            t('privacy_s9_i1'),
            t('privacy_s9_i2'),
            t('privacy_s9_i3'),
            t('privacy_s9_i4'),
            t('privacy_s9_i5'),
          ],
        },
        {
          heading: t('privacy_s10_h'),
          body: t('privacy_s10_b'),
        },
        {
          heading: t('privacy_s11_h'),
          body: t('privacy_s11_b'),
        },
        {
          heading: t('privacy_s12_h'),
          body: t('privacy_s12_b'),
        },
        {
          heading: t('privacy_s13_h'),
          body: t('privacy_s13_b'),
        },
        {
          heading: t('privacy_s14_h'),
          body: t('privacy_s14_b'),
        },
      ]}
    />
  );
}
