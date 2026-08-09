import { LegalPage } from '@/components/legal/LegalPage';

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="August 2026"
      intro={'House Agent ("we", "our", "us") is committed to protecting your privacy. This policy explains what personal data we collect, why we collect it, how we use and protect it, and the rights you have over your information.'}
      sections={[
        {
          heading: '1. What We Collect',
          items: [
            'Account information: name, email address, phone number, language preference and password (stored securely as a hashed value).',
            'Identity documents: passport or national ID images and the data on them, submitted for identity verification.',
            'Profile information: gender, occupation, nationality, budget, habits and preferences that you choose to share.',
            'Listing and housemate posts: property details, photos, prices and descriptions you publish.',
            'Communications: messages sent through the in-app chat, including timestamps.',
            'Usage data: pages visited, search terms, saved listings and device/browser information.',
            'Transaction records: where you pay for platform services, the details needed to complete the payment.',
          ],
        },
        {
          heading: '2. Why We Collect Your Data',
          items: [
            'To create and manage your account and verify your identity.',
            'To allow you to publish listings, search for properties and find roommates or housemates.',
            'To connect you with agents and other users through our messaging system.',
            'To prevent fraud, abuse and unsafe conduct, and to resolve disputes.',
            'To improve, analyse and secure the platform.',
            'To comply with legal obligations.',
          ],
        },
        {
          heading: '3. Identity Documents and Verification',
          body:
            'We collect passport or national ID images solely to verify your identity and protect the community from fraud. Documents are stored securely with restricted access, and we do not display your identity document to other users. You may request deletion of your identity documents after verification, subject to our legal retention obligations.',
        },
        {
          heading: '4. Chat and Communication Privacy',
          body:
            'Your in-app messages are private between you and the recipient and are not visible to other users. However, to keep the platform safe and to resolve disputes, House Agent administrators can access and review stored conversations. We never sell or share your messages with advertisers or other third parties. Do not share passwords, payment card details or sensitive documents in chat, even with admins.',
        },
        {
          heading: '5. How We Share Your Data',
          items: [
            'With agents: when you contact an agent, the information you provide in that enquiry is shared with them so they can respond.',
            'With service providers: trusted providers that help us operate the platform (hosting, analytics, identity verification, payment processing) process data only under our instructions.',
            'With authorities: where required by law, court order, or to protect the rights and safety of users and the public.',
          ],
        },
        {
          heading: '6. We Do Not Sell Your Data',
          body:
            'We never sell your personal data to third parties. We do not use your identity documents, chats or contact details for advertising.',
        },
        {
          heading: '7. Data Security',
          items: [
            'All traffic to and from the platform is encrypted in transit (HTTPS).',
            'Passwords are stored as hashes, never in plain text.',
            'Identity documents and chats are stored with restricted, role-based access.',
            'We review our security practices regularly and limit access to personal data to staff who need it.',
          ],
        },
        {
          heading: '8. How Long We Keep Your Data',
          body:
            'We keep your account data for as long as your account is active and for a reasonable period afterwards to meet legal, tax or dispute-resolution requirements. Identity documents are retained only while needed for verification and safety, and are deleted on request subject to legal obligations.',
        },
        {
          heading: '9. Your Rights',
          items: [
            'Access: request a copy of the personal data we hold about you.',
            'Correction: ask us to correct inaccurate information.',
            'Deletion: request deletion of your account and data, subject to legal limits.',
            'Export: request your data in a portable format.',
            'Objection and restriction: ask us to stop or limit certain processing.',
          ],
        },
        {
          heading: '10. Cookies',
          body:
            'We use essential cookies and local storage to keep you signed in and to remember your preferences. Where analytics are used, they help us understand how the platform is used so we can improve it. You can control cookies through your browser settings.',
        },
        {
          heading: '11. International Transfers',
          body:
            'Our platform is hosted on servers that may be located outside North Cyprus. By using the platform, you acknowledge that your data may be transferred to and processed in other jurisdictions, which we protect with appropriate safeguards.',
        },
        {
          heading: '12. Children',
          body:
            'The platform is intended for users aged 18 and over. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, contact us and we will delete it.',
        },
        {
          heading: '13. Changes to This Policy',
          body:
            'We may update this Privacy Policy from time to time. We will post changes on this page and, for material changes, notify you through the platform. Continued use after changes take effect means you accept the updated policy.',
        },
        {
          heading: '14. Contact and Data Protection',
          body:
            'If you have questions or requests about your privacy, please contact us at support@houseagent.app. We will respond to your request within a reasonable time.',
        },
      ]}
    />
  );
}
