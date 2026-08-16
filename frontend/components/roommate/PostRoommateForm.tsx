'use client';

import React, { useRef, useState } from 'react';
import { X, Camera, Home, Users } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { UNIVERSITIES_BY_CITY } from '@/lib/universities';
import styles from './PostRoommateForm.module.css';

const HOUSE_TYPES = ['Studio', '1+1', '2+1', '3+1', '4+1', '5+1', '6+1'];
const HABITS = [
  'Non-smoker',
  'Quiet',
  'Early bird',
  'Night owl',
  'Clean',
  'Cook',
  'Pet friendly',
  'Gym',
  'Social',
  'No guests',
];

type PostRoommateFormProps = {
  onClose: () => void;
  onPosted: () => void;
};

export function PostRoommateForm({ onClose, onPosted }: PostRoommateFormProps) {
  const { user, isAuthenticated } = useAuthStore();
  const t = useLanguageStore((s) => s.t);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const roomFilesInputRef = useRef<HTMLInputElement>(null);
  const [profileType, setProfileType] = useState<'roommate' | 'housemate'>('housemate');
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [occupation, setOccupation] = useState('');
  const [university, setUniversity] = useState('');
  const [houseType, setHouseType] = useState('');
  const [nationality, setNationality] = useState('');
  const [budget, setBudget] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [moveInDate, setMoveInDate] = useState('');
  const [durationMonths, setDurationMonths] = useState('');
  const [bio, setBio] = useState('');
  const [habits, setHabits] = useState<string[]>([]);
  const [genderPreference, setGenderPreference] = useState('Any');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [roomPhotos, setRoomPhotos] = useState<File[]>([]);
  const [roomPreviews, setRoomPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const habitLabel = (habit: string) => {
    const map: Record<string, string> = {
      'Non-smoker': t('prf_habit_non_smoker'),
      'Quiet': t('prf_habit_quiet'),
      'Early bird': t('prf_habit_early_bird'),
      'Night owl': t('prf_habit_night_owl'),
      'Clean': t('prf_habit_clean'),
      'Cook': t('prf_habit_cook'),
      'Pet friendly': t('prf_habit_pet_friendly'),
      'Gym': t('prf_habit_gym'),
      'Social': t('prf_habit_social'),
      'No guests': t('prf_habit_no_guests'),
    };
    return map[habit] || habit;
  };

  const toggleHabit = (habit: string) => {
    setHabits((prev) => (prev.includes(habit) ? prev.filter((h) => h !== habit) : [...prev, habit]));
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(t('prf_err_image'));
      return;
    }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleRoomFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (valid.length !== files.length) {
      setError(t('prf_err_image'));
      return;
    }
    const next = [...roomPhotos, ...valid].slice(0, 6);
    setRoomPhotos(next);
    setRoomPreviews(next.map((f) => URL.createObjectURL(f)));
    setError(null);
  };

  const removeRoomPhoto = (idx: number) => {
    setRoomPhotos((prev) => prev.filter((_, i) => i !== idx));
    setRoomPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!isAuthenticated) {
      setError(t('prf_err_signin'));
      return;
    }
    if (!name.trim() || !age || !gender || !occupation || !budget) {
      setError(t('prf_err_fields'));
      return;
    }
    const numAge = parseInt(age, 10);
    const numBudget = parseInt(budget, 10);
    if (isNaN(numAge) || numAge < 18 || numAge > 99) {
      setError(t('prf_err_age'));
      return;
    }
    if (isNaN(numBudget) || numBudget <= 0) {
      setError(t('prf_err_budget'));
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (photo) {
        const formData = new FormData();
        formData.append('file', photo);
        const res = await apiRequest('/roommates/photo', { method: 'POST', formData });
        photoUrl = (res as { url: string }).url;
      }

      const photoUrls: string[] = [];
      for (const file of roomPhotos) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiRequest('/roommates/photo', { method: 'POST', formData });
        photoUrls.push((res as { url: string }).url);
      }

      const payload = {
        name: name.trim(),
        age: numAge,
        gender,
        occupation: occupation.trim(),
        university: university.trim() || null,
        profile_type: profileType,
        house_type: profileType === 'housemate' ? houseType || null : null,
        nationality: nationality.trim() || null,
        budget: numBudget,
        looking_for_city: cities,
        move_in_date: new Date(moveInDate || Date.now()).toISOString(),
        duration_months: parseInt(durationMonths, 10) || 12,
        bio: bio.trim() || t('prf_default_bio'),
        habits,
        gender_preference: genderPreference,
        avatar_url: photoUrl,
        photos: photoUrls.length > 0 ? photoUrls : null,
      };

      await apiRequest('/roommates', { method: 'POST', body: payload });
      onPosted();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || t('prf_err_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{profileType === 'housemate' ? t('prf_title_room') : t('prf_title_profile')}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label={t('prf_close')}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.typeToggle}>
          <button
            className={`${styles.typeBtn} ${profileType === 'housemate' ? styles.typeBtnActive : ''}`}
            onClick={() => setProfileType('housemate')}
          >
            <Home size={18} className={styles.typeToggleIcon} />
            {t('prf_type_housemate')}
            <span className={styles.typeHint}>{t('prf_type_housemate_hint')}</span>
          </button>
          <button
            className={`${styles.typeBtn} ${profileType === 'roommate' ? styles.typeBtnActive : ''}`}
            onClick={() => setProfileType('roommate')}
          >
            <Users size={18} className={styles.typeToggleIcon} />
            {t('prf_type_roommate')}
            <span className={styles.typeHint}>{t('prf_type_roommate_hint')}</span>
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.photoBox} onClick={() => fileInputRef.current?.click()}>
            {preview ? (
              <img src={preview} alt={t('chat_preview')} className={styles.photoPreview} />
            ) : (
              <div className={styles.photoPlaceholder}>
                <Camera size={28} />
                <span>{t('prf_photo_placeholder')}</span>
                <small>{t('prf_photo_hint')}</small>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          <div className={styles.roomPhotos}>
            <span className={styles.roomPhotosLabel}>{t('prf_room_photos')}</span>
            <div className={styles.roomPhotosGrid}>
              {roomPreviews.map((src, idx) => (
                <div key={idx} className={styles.roomPhoto}>
                  <div className={styles.roomPhotoImg} style={{ backgroundImage: `url(${src})` }} />
                  <button type="button" className={styles.roomPhotoRemove} onClick={() => removeRoomPhoto(idx)} aria-label={t('prf_remove_photo')}>
                    <X size={12} />
                  </button>
                </div>
              ))}
              {roomPhotos.length < 6 && (
                <button type="button" className={styles.roomPhotoAdd} onClick={() => roomFilesInputRef.current?.click()}>
                  <Camera size={18} />
                  <span>{t('prf_add_room_photo')}</span>
                </button>
              )}
            </div>
            <small className={styles.roomPhotosHint}>{t('prf_room_photos_hint')}</small>
            <input
              ref={roomFilesInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => { handleRoomFiles(e.target.files); e.target.value = ''; }}
            />
          </div>

          <div className={styles.grid}>
            <label className={styles.field}>
              <span>{t('prf_name')}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('prf_name_placeholder')} />
            </label>
            <label className={styles.field}>
              <span>{t('prf_age')}</span>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder={t('prf_age_placeholder')} min={18} max={99} />
            </label>
            <label className={styles.field}>
              <span>{t('prf_gender')}</span>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">{t('prf_select')}</option>
                <option value="Male">{t('prf_male')}</option>
                <option value="Female">{t('prf_female')}</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>{t('prf_occupation')}</span>
              <input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder={t('prf_occupation_placeholder')} />
            </label>
            <label className={styles.field}>
              <span>{t('prf_university')}</span>
              <select value={university} onChange={(e) => setUniversity(e.target.value)}>
                <option value="">{t('prf_university_placeholder')}</option>
                {UNIVERSITIES_BY_CITY.map((group) => (
                  <optgroup key={group.city} label={group.city}>
                    {group.schools.map((school) => (
                      <option key={school} value={school}>{school}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>{t('prf_nationality')}</span>
              <input value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder={t('prf_nationality_placeholder')} />
            </label>
            {profileType === 'housemate' && (
              <label className={styles.field}>
                <span>{t('prf_flat_type')}</span>
                <select value={houseType} onChange={(e) => setHouseType(e.target.value)}>
                  <option value="">{t('prf_select')}</option>
                  {HOUSE_TYPES.map((ht) => (
                    <option key={ht} value={ht}>{ht === 'Studio' ? t('prf_studio') : ht}</option>
                  ))}
                </select>
              </label>
            )}
            <label className={styles.field}>
              <span>{t('prf_budget')}</span>
              <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder={t('prf_budget_placeholder')} min={1} />
            </label>
            <label className={styles.field}>
              <span>{t('prf_looking_in')}</span>
              <select
                value={cities[0] || ''}
                onChange={(e) => {
                  const school = e.target.value;
                  if (!school) {
                    setCities([]);
                    return;
                  }
                  const group = UNIVERSITIES_BY_CITY.find((g) => g.schools.includes(school));
                  setCities(group ? [group.city] : [school]);
                }}
              >
                <option value="">{t('prf_area_placeholder')}</option>
                {UNIVERSITIES_BY_CITY.map((group) => (
                  <optgroup key={group.city} label={group.city}>
                    {group.schools.map((school) => (
                      <option key={school} value={school}>{school}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>{t('prf_move_in_date')}</span>
              <input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
            </label>
            <label className={styles.field}>
              <span>{t('prf_duration')}</span>
              <input type="number" value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)} placeholder={t('prf_duration_placeholder')} min={1} />
            </label>
            <label className={styles.field}>
              <span>{t('prf_pref_gender')}</span>
              <select value={genderPreference} onChange={(e) => setGenderPreference(e.target.value)}>
                <option value="Any">{t('prf_any')}</option>
                <option value="Male">{t('prf_male')}</option>
                <option value="Female">{t('prf_female')}</option>
              </select>
            </label>
          </div>

          <label className={styles.field}>
            <span>{t('prf_habits')}</span>
            <div className={styles.chips}>
              {HABITS.map((habit) => (
                <button
                  key={habit}
                  type="button"
                  className={`${styles.chip} ${habits.includes(habit) ? styles.chipActive : ''}`}
                  onClick={() => toggleHabit(habit)}
                >
                  {habitLabel(habit)}
                </button>
              ))}
            </div>
          </label>

          <label className={styles.field}>
            <span>{t('prf_about')}</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder={profileType === 'housemate'
                ? t('prf_about_housemate')
                : t('prf_about_roommate')}
            />
          </label>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.footer}>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
            {submitting ? t('prf_posting') : t('prf_post_ad')}
          </button>
        </div>
      </div>
    </div>
  );
}
