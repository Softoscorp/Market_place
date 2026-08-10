'use client';

import { LegalPage } from '@/components/legal/LegalPage';
import { useLanguageStore } from '@/lib/store/useLanguageStore';

export default function TermsPage() {
  const t = useLanguageStore((s) => s.t);
  return (
    <LegalPage
      title={t('terms_title')}
      updated={t('terms_updated')}
      intro={t('terms_intro')}
      sections={[
        {
          heading: t('terms_s1_h'),
          body: t('terms_s1_b'),
        },
        {
          heading: t('terms_s2_h'),
          items: [t('terms_s2_i1'), t('terms_s2_i2'), t('terms_s2_i3')],
        },
        {
          heading: t('terms_s3_h'),
          body: t('terms_s3_b'),
        },
        {
          heading: t('terms_s4_h'),
          items: [t('terms_s4_i1'), t('terms_s4_i2'), t('terms_s4_i3')],
        },
        {
          heading: t('terms_s5_h'),
          items: [
            t('terms_s5_i1'),
            t('terms_s5_i2'),
            t('terms_s5_i3'),
            t('terms_s5_i4'),
            t('terms_s5_i5'),
            t('terms_s5_i6'),
          ],
        },
        {
          heading: t('terms_s6_h'),
          body: t('terms_s6_b'),
        },
        {
          heading: t('terms_s7_h'),
          body: t('terms_s7_b'),
        },
        {
          heading: t('terms_s8_h'),
          body: t('terms_s8_b'),
        },
        {
          heading: t('terms_s9_h'),
          body: t('terms_s9_b'),
        },
        {
          heading: t('terms_s10_h'),
          body: t('terms_s10_b'),
        },
        {
          heading: t('terms_s11_h'),
          body: t('terms_s11_b'),
        },
        {
          heading: t('terms_s12_h'),
          body: t('terms_s12_b'),
        },
        {
          heading: t('terms_s13_h'),
          body: t('terms_s13_b'),
        },
        {
          heading: t('terms_s14_h'),
          body: t('terms_s14_b'),
        },
        {
          heading: t('terms_s15_h'),
          body: t('terms_s15_b'),
        },
      ]}
    />
  );
}
