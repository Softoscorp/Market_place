'use client';

import { LegalPage } from '@/components/legal/LegalPage';
import { useLanguageStore } from '@/lib/store/useLanguageStore';

export default function RulesPage() {
  const t = useLanguageStore((s) => s.t);
  return (
    <LegalPage
      title={t('rules_title')}
      updated={t('rules_updated')}
      intro={t('rules_intro')}
      sections={[
        {
          heading: t('rules_s1_h'),
          items: [
            t('rules_s1_i1'),
            t('rules_s1_i2'),
            t('rules_s1_i3'),
            t('rules_s1_i4'),
            t('rules_s1_i5'),
            t('rules_s1_i6'),
            t('rules_s1_i7'),
          ],
        },
        {
          heading: t('rules_s2_h'),
          items: [
            t('rules_s2_i1'),
            t('rules_s2_i2'),
            t('rules_s2_i3'),
            t('rules_s2_i4'),
            t('rules_s2_i5'),
          ],
        },
        {
          heading: t('rules_s3_h'),
          items: [
            t('rules_s3_i1'),
            t('rules_s3_i2'),
            t('rules_s3_i3'),
            t('rules_s3_i4'),
          ],
        },
        {
          heading: t('rules_s4_h'),
          items: [
            t('rules_s4_i1'),
            t('rules_s4_i2'),
            t('rules_s4_i3'),
            t('rules_s4_i4'),
            t('rules_s4_i5'),
          ],
        },
        {
          heading: t('rules_s5_h'),
          items: [
            t('rules_s5_i1'),
            t('rules_s5_i2'),
            t('rules_s5_i3'),
            t('rules_s5_i4'),
          ],
        },
        {
          heading: t('rules_s6_h'),
          items: [
            t('rules_s6_i1'),
            t('rules_s6_i2'),
            t('rules_s6_i3'),
            t('rules_s6_i4'),
            t('rules_s6_i5'),
          ],
        },
        {
          heading: t('rules_s7_h'),
          body: t('rules_s7_b'),
        },
      ]}
    />
  );
}