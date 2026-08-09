import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';
import styles from './LegalPage.module.css';

export type LegalSection = {
  heading: string;
  body?: string;
  items?: string[];
};

type LegalPageProps = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalPage({ title, updated, intro, sections }: LegalPageProps) {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Logo variant="full" height={64} />
        </div>

        <header className={styles.header}>
          <h1>{title}</h1>
          <p className={styles.updated}>Last updated: {updated}</p>
        </header>

        <p className={styles.intro}>{intro}</p>

        <div className={styles.sections}>
          {sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body && <p>{section.body}</p>}
              {section.items && (
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <footer className={styles.notice}>
          <p>
            This page is provided for general information and does not constitute legal
            advice. Please contact us at{' '}
            <Link href="/contact">support@houseagent.app</Link> with any questions, and
            consult a qualified professional for advice specific to your situation.
          </p>
        </footer>
      </div>
    </div>
  );
}
