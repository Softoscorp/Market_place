import { LegalPage } from '@/components/legal/LegalPage';

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="August 2026"
      intro="Please read these Terms of Service carefully before using the House Agent platform. By creating an account, browsing, or posting on House Agent, you agree to be bound by these terms."
      sections={[
        {
          heading: '1. About the Service',
          body:
            'House Agent is an online housing platform for North Cyprus. It connects tenants and students with rental listings, lets registered agents manage and verify their properties, and helps people find roommates and housemates. We are a marketplace and communications platform; we are not a landlord, and we do not own the properties listed on the platform.',
        },
        {
          heading: '2. Eligibility',
          items: [
            'You must be at least 18 years old to create an account.',
            'You must provide accurate, current and complete information, including a valid passport or national identity document where identity verification is required.',
            'You must not use the platform if you are prohibited from doing so by law.',
          ],
        },
        {
          heading: '3. Identity Verification',
          body:
            'To protect tenants, agents and the community, House Agent collects identity documents such as passports or national ID cards, and may perform identity and document checks before an account is fully verified. You authorise House Agent to store, review and verify the documents you submit, and to reject verification where documents are illegible, expired or cannot be validated.',
        },
        {
          heading: '4. Accounts',
          items: [
            'You are responsible for safeguarding your login credentials and for all activity under your account.',
            'You may not create multiple accounts to evade verification, reviews, or restrictions.',
            'You must immediately notify us of any unauthorised use of your account.',
          ],
        },
        {
          heading: '5. User Conduct',
          items: [
            'Provide truthful and accurate information in listings, profiles and messages.',
            'Do not post fraudulent, misleading or deceptive listings or photos.',
            'Do not engage in harassment, discrimination prohibited by law, or threatening behaviour.',
            'Do not use the platform to collect personal information about other users beyond what is necessary to arrange a rental.',
            'Do not attempt to circumvent platform fees, verification, or safety controls.',
            'Comply with all applicable laws of North Cyprus (TRNC) and your home country.',
          ],
        },
        {
          heading: '6. Listings and Housemate Posts',
          body:
            'Agents and tenants may publish property listings and room/housemate posts. You are solely responsible for the content you publish and for the accuracy of the information it contains. By posting, you confirm that you are authorised to offer the property or room and that all details, including photos and pricing, are accurate. We may remove content that breaches these terms, is unlawful, or is reported by other users.',
        },
        {
          heading: '7. Communications and Monitoring',
          body:
            'The platform includes in-app messaging between tenants, agents and housemate seekers. To prevent fraud, resolve disputes and keep the community safe, messages may be stored and reviewed by House Agent administrators. Do not use the platform to communicate sensitive information you do not wish our moderation team to be able to access.',
        },
        {
          heading: '8. Fees and Payments',
          body:
            'Certain services, such as premium or verified agent accounts, may be subject to fees. Fees will be clearly displayed before you commit to them and are non-refundable except where required by law or stated otherwise. Rental payments between tenants and agents are arranged directly between the parties unless we state that we process them.',
        },
        {
          heading: '9. No Endorsement or Guarantee',
          body:
            'House Agent does not guarantee the accuracy of listings, the identity or conduct of any user, or the condition of any property. Verification confirms that identity documents were checked; it is not a guarantee of a user\u2019s reliability. You are responsible for your own due diligence, including viewing properties and confirming tenancy terms, before entering any agreement.',
        },
        {
          heading: '10. Intellectual Property',
          body:
            'The House Agent name, logo, design and content are owned by us or our licensors. You may not copy, modify, distribute or reuse our platform content or branding without our written permission. You retain ownership of the content you post, and you grant us a licence to host, display and share it on the platform.',
        },
        {
          heading: '11. Disclaimers and Limitation of Liability',
          body:
            'The platform is provided on an "as is" and "as available" basis. To the maximum extent permitted by law, House Agent disclaims all warranties, and shall not be liable for indirect, incidental or consequential damages, or for losses arising from your use of, or inability to use, the platform, your dealings with other users, or any rental or tenancy arrangement you enter into.',
        },
        {
          heading: '12. Termination',
          body:
            'We may suspend or terminate your account if you breach these terms, engage in unlawful or harmful conduct, or where required by law. You may delete your account at any time. Termination does not affect rights and obligations that have already arisen.',
        },
        {
          heading: '13. Governing Law',
          body:
            'These terms are governed by the laws of the Turkish Republic of Northern Cyprus. You agree that any disputes will be subject to the exclusive jurisdiction of the courts of North Cyprus, except where mandatory local law provides otherwise.',
        },
        {
          heading: '14. Changes to These Terms',
          body:
            'We may update these terms from time to time. We will notify you of material changes through the platform. Continued use of House Agent after changes take effect means you accept the updated terms.',
        },
        {
          heading: '15. Contact',
          body:
            'If you have questions about these terms, please contact us through the Contact page or at support@houseagent.app.',
        },
      ]}
    />
  );
}
