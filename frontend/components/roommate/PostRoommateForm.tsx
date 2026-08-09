'use client';

import React, { useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';
import { apiRequest, mediaUrl } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import styles from './PostRoommateForm.module.css';

const CITIES = ['Famagusta (EMU)', 'Nicosia (CIU/NEU)', 'Kyrenia (GAU)'];
const HOUSE_TYPES = ['Studio', '1+1', '2+1', '3+1', '4+1'];
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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCity = (city: string) => {
    setCities((prev) => (prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]));
  };

  const toggleHabit = (habit: string) => {
    setHabits((prev) => (prev.includes(habit) ? prev.filter((h) => h !== habit) : [...prev, habit]));
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG or WebP).');
      return;
    }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!isAuthenticated) {
      setError('Please sign in as a tenant before posting.');
      return;
    }
    if (!name.trim() || !age || !gender || !occupation || !budget) {
      setError('Please fill in your name, age, gender, occupation and budget.');
      return;
    }
    const numAge = parseInt(age, 10);
    const numBudget = parseInt(budget, 10);
    if (isNaN(numAge) || numAge < 18 || numAge > 99) {
      setError('Please enter a valid age (18 or older).');
      return;
    }
    if (isNaN(numBudget) || numBudget <= 0) {
      setError('Please enter a valid monthly budget.');
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
        bio: bio.trim() || 'Looking for a friendly housemate.',
        habits,
        gender_preference: genderPreference,
        avatar_url: photoUrl,
      };

      await apiRequest('/roommates', { method: 'POST', body: payload });
      onPosted();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{profileType === 'housemate' ? 'Post a Housemate Ad' : 'Post a Roommate Profile'}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className={styles.typeToggle}>
          <button
            className={`${styles.typeBtn} ${profileType === 'housemate' ? styles.typeBtnActive : ''}`}
            onClick={() => setProfileType('housemate')}
          >
            🏠 Housemate
            <span className={styles.typeHint}>I have a flat, one room is free</span>
          </button>
          <button
            className={`${styles.typeBtn} ${profileType === 'roommate' ? styles.typeBtnActive : ''}`}
            onClick={() => setProfileType('roommate')}
          >
            🤝 Roommate
            <span className={styles.typeHint}>I want to share a room</span>
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.photoBox} onClick={() => fileInputRef.current?.click()}>
            {preview ? (
              <img src={preview} alt="Preview" className={styles.photoPreview} />
            ) : (
              <div className={styles.photoPlaceholder}>
                <Camera size={28} />
                <span>Snap a photo of the room</span>
                <small>JPG, PNG or WebP</small>
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

          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Name *</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </label>
            <label className={styles.field}>
              <span>Age *</span>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 22" min={18} max={99} />
            </label>
            <label className={styles.field}>
              <span>Gender *</span>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Occupation *</span>
              <input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="e.g. Student, Engineer" />
            </label>
            <label className={styles.field}>
              <span>University</span>
              <input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="e.g. EMU" />
            </label>
            <label className={styles.field}>
              <span>Nationality</span>
              <input value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="e.g. Nigerian" />
            </label>
            {profileType === 'housemate' && (
              <label className={styles.field}>
                <span>Flat type</span>
                <select value={houseType} onChange={(e) => setHouseType(e.target.value)}>
                  <option value="">Select...</option>
                  {HOUSE_TYPES.map((ht) => (
                    <option key={ht} value={ht}>{ht}</option>
                  ))}
                </select>
              </label>
            )}
            <label className={styles.field}>
              <span>Monthly budget (room) *</span>
              <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 300" min={1} />
            </label>
            <label className={styles.field}>
              <span>Looking in</span>
              <div className={styles.chips}>
                {CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    className={`${styles.chip} ${cities.includes(city) ? styles.chipActive : ''}`}
                    onClick={() => toggleCity(city)}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </label>
            <label className={styles.field}>
              <span>Move-in date</span>
              <input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Stay duration (months)</span>
              <input type="number" value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)} placeholder="e.g. 12" min={1} />
            </label>
            <label className={styles.field}>
              <span>Preferred gender</span>
              <select value={genderPreference} onChange={(e) => setGenderPreference(e.target.value)}>
                <option value="Any">Any</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>
          </div>

          <label className={styles.field}>
            <span>Habits</span>
            <div className={styles.chips}>
              {HABITS.map((habit) => (
                <button
                  key={habit}
                  type="button"
                  className={`${styles.chip} ${habits.includes(habit) ? styles.chipActive : ''}`}
                  onClick={() => toggleHabit(habit)}
                >
                  {habit}
                </button>
              ))}
            </div>
          </label>

          <label className={styles.field}>
            <span>About the room / you</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder={profileType === 'housemate'
                ? 'Describe the flat, the room, rent, bills, and who you are looking for.'
                : 'Tell people a bit about yourself and what you are looking for.'}
            />
          </label>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.footer}>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Posting...' : 'Post Ad'}
          </button>
        </div>
      </div>
    </div>
  );
}
