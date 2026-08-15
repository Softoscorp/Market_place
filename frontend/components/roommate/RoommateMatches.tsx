'use client';

import React from 'react';
import { Sparkles, BedDouble, Sofa } from 'lucide-react';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { mediaUrl } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import styles from './RoommateMatches.module.css';

interface MatchReason {
  key: string;
  params?: Record<string, string> | null;
}

interface MatchProfile {
  id: number;
  name?: string;
  age?: number;
  gender?: string;
  occupation?: string;
  profile_type?: string;
  avatar_url?: string | null;
  looking_for_city?: string[];
  user?: { name?: string; avatar_url?: string };
}

export interface RoommateMatch {
  profile: MatchProfile;
  score: number;
  reasons: MatchReason[];
}

interface RoommateMatchesProps {
  matches: RoommateMatch[];
  loading?: boolean;
}

const REASON_KEY_MAP: Record<string, string> = {
  match_reason_city: 'rm_matched_city',
  match_reason_budget: 'rm_matched_budget',
  match_reason_timeline: 'rm_matched_timeline',
  match_reason_gender: 'rm_matched_gender',
  match_reason_type: 'rm_matched_type',
  match_reason_habits: 'rm_matched_habits',
};

export function RoommateMatches({ matches, loading }: RoommateMatchesProps) {
  const { t } = useLanguageStore();

  if (loading) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>{t('rm_your_matches')}</h2>
        <p className={styles.loading}>{t('loading')}...</p>
      </section>
    );
  }

  if (matches.length === 0) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>{t('rm_your_matches')}</h2>
        <p className={styles.empty}>{t('rm_no_matches_found')}</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Sparkles size={18} className={styles.titleIcon} aria-hidden="true" />
          {t('rm_your_matches')}
        </h2>
        <p className={styles.subtitle}>{t('rm_your_matches_sub')}</p>
      </div>

      <div className={styles.list}>
        {matches.map((match) => {
          const profile = match.profile;
          const name = profile.name || profile.user?.name || t('common_user');
          const avatar = mediaUrl(profile.avatar_url) || mediaUrl(profile.user?.avatar_url) || '';
          const profileType = profile.profile_type || 'roommate';
          const location = (profile.looking_for_city || []).slice(0, 2).join(', ');

          return (
            <div key={profile.id} className={styles.row}>
              <div className={styles.thumb}>
                {avatar ? (
                  <Avatar src={avatar} alt={name} size="xl" className={styles.thumbImg} />
                ) : (
                  <div className={`${styles.thumbImg} ${styles.thumbFallback}`}>
                    {profileType === 'housemate' ? <BedDouble size={26} /> : <Sofa size={26} />}
                  </div>
                )}
              </div>

              <div className={styles.info}>
                <div className={styles.nameRow}>
                  <span className={styles.name}>
                    {name}
                    {profile.age ? `, ${profile.age}` : ''}
                  </span>
                  <span className={`${styles.score} ${match.score >= 80 ? styles.scoreHigh : match.score >= 60 ? styles.scoreMid : ''}`}>
                    {t('rm_match_score').replace('{score}', String(match.score))}
                  </span>
                </div>
                {location && <span className={styles.location}>{location}</span>}

                <div className={styles.reasons}>
                  {match.reasons.map((reason, idx) => {
                    const key = REASON_KEY_MAP[reason.key] || reason.key;
                    let text = t(key as never);
                    if (reason.params) {
                      Object.entries(reason.params).forEach(([k, v]) => {
                        text = text.replace(`{${k}}`, v);
                      });
                    }
                    return (
                      <span key={idx} className={styles.reason}>
                        {text}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
