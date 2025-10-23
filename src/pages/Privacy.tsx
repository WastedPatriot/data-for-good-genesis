import { motion } from "framer-motion";
import { Shield } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border-2 border-border rounded-xl p-8 md:p-12"
        >
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-black">Privacy Policy</h1>
          </div>

          <div className="space-y-6 text-muted-foreground">
            <p className="text-sm">Last Updated: {new Date().toLocaleDateString()}</p>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">1. Introduction</h2>
              <p>Data for Earth ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">2. Information We Collect</h2>
              <h3 className="text-xl font-bold text-foreground mb-2">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account information (email, password)</li>
                <li>Organization details (name, type, contact information)</li>
                <li>Data contributions (demographics, technology usage, environmental data)</li>
                <li>Payment information (processed securely by Stripe)</li>
                <li>Communications (contact forms, support requests)</li>
              </ul>

              <h3 className="text-xl font-bold text-foreground mb-2 mt-4">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, features used, time spent)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Data Processing:</strong> AI-powered analysis and categorization of contributed data</li>
                <li><strong>Marketplace Operations:</strong> Managing purchases, access, and downloads</li>
                <li><strong>Account Management:</strong> Maintaining and securing your account</li>
                <li><strong>Communications:</strong> Sending confirmations, updates, and support responses</li>
                <li><strong>Platform Improvement:</strong> Analyzing usage to enhance features and security</li>
                <li><strong>Compliance:</strong> Meeting legal obligations and preventing fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">4. Data Anonymization</h2>
              <p>All contributed data undergoes automated anonymization before being made available in our marketplace:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Personal identifiers are removed or encrypted</li>
                <li>Data is aggregated to prevent individual identification</li>
                <li>Our AI system validates anonymization quality</li>
                <li>Datasets are reviewed before marketplace publication</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">5. Data Sharing and Disclosure</h2>
              <p>We share information only in these circumstances:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Marketplace Purchases:</strong> Anonymized datasets sold to verified purchasers</li>
                <li><strong>Service Providers:</strong> Stripe (payments), Resend (emails), hosting providers</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect rights</li>
                <li><strong>With Consent:</strong> When you explicitly authorize sharing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">6. Data Security</h2>
              <p>We implement industry-leading security measures:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>End-to-end encryption for data in transit and at rest</li>
                <li>Row-Level Security (RLS) policies on all database tables</li>
                <li>Comprehensive audit logging of all access and modifications</li>
                <li>Regular security audits and penetration testing</li>
                <li>Multi-factor authentication for administrative access</li>
                <li>Automated threat detection and monitoring</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">7. Your Rights</h2>
              <p>Under GDPR, CCPA, and other data protection laws, you have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate information</li>
                <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
                <li><strong>Object:</strong> Opt out of certain data processing activities</li>
                <li><strong>Withdraw Consent:</strong> Revoke previously given consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">8. International Data Transfers</h2>
              <p>We operate globally and may transfer data across borders. We ensure adequate protection through:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Standard contractual clauses approved by regulatory authorities</li>
                <li>Compliance with Privacy Shield principles where applicable</li>
                <li>Adequate security measures in all jurisdictions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">9. Children's Privacy</h2>
              <p>Our platform is not intended for individuals under 16. We do not knowingly collect data from children. If you believe we have collected information from a child, please contact us immediately.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">10. Data Retention</h2>
              <p>We retain data only as long as necessary for the purposes outlined in this policy or as required by law:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Account data: Until account deletion + 30 days</li>
                <li>Marketplace purchases: 7 years for financial compliance</li>
                <li>Contributed data: Until deletion request or account closure</li>
                <li>Audit logs: 2 years for security purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">11. Changes to This Policy</h2>
              <p>We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notification. Continued use after changes constitutes acceptance.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">12. Contact Us</h2>
              <p>For privacy-related questions or to exercise your rights:</p>
              <ul className="list-none space-y-2 mt-2">
                <li><strong>Email:</strong> privacy@dataforearth.org</li>
                <li><strong>Data Protection Officer:</strong> dpo@dataforearth.org</li>
                <li><strong>Contact Form:</strong> Use our Contact page</li>
              </ul>
            </section>

            <section className="border-t-2 border-border pt-6 mt-8">
              <p className="text-sm">
                <strong>Compliance Certifications:</strong> GDPR (EU), CCPA (California), PIPEDA (Canada), ISO 27001, SOC 2 Type II
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy;
