import { motion } from "framer-motion";
import { FileText } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border-2 border-border rounded-xl p-8 md:p-12"
        >
          <div className="flex items-center gap-3 mb-8">
            <FileText className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-black">Terms of Service</h1>
          </div>

          <div className="space-y-6 text-muted-foreground">
            <p className="text-sm">Last Updated: {new Date().toLocaleDateString()}</p>
            <p className="text-sm"><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using Data for Earth's platform, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access our services.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">2. Description of Service</h2>
              <p>Data for Earth operates an ethical data marketplace that:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Collects data contributions from individuals and organizations</li>
                <li>Processes and anonymizes data using AI technology</li>
                <li>Offers anonymized datasets for purchase</li>
                <li>Directs revenue to environmental and climate initiatives</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">3. User Accounts</h2>
              <h3 className="text-xl font-bold text-foreground mb-2">3.1 Account Creation</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must provide accurate, current information</li>
                <li>You are responsible for maintaining account security</li>
                <li>You must be at least 16 years old to create an account</li>
                <li>One person or entity may not maintain multiple accounts</li>
              </ul>

              <h3 className="text-xl font-bold text-foreground mb-2 mt-4">3.2 Account Termination</h3>
              <p>We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activities.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">4. Data Contribution</h2>
              <h3 className="text-xl font-bold text-foreground mb-2">4.1 Your Representations</h3>
              <p>By contributing data, you represent and warrant that:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>You own or have rights to the data you submit</li>
                <li>The data does not violate any laws or third-party rights</li>
                <li>The information provided is accurate and truthful</li>
                <li>You consent to data processing and anonymization</li>
              </ul>

              <h3 className="text-xl font-bold text-foreground mb-2 mt-4">4.2 License Grant</h3>
              <p>You grant us a worldwide, royalty-free, perpetual license to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Process, analyze, and anonymize your contributed data</li>
                <li>Include anonymized data in marketplace datasets</li>
                <li>Use data to improve our AI processing systems</li>
                <li>Aggregate data for research and platform optimization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">5. Marketplace Purchases</h2>
              <h3 className="text-xl font-bold text-foreground mb-2">5.1 Purchase Terms</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>All purchases are final unless otherwise stated</li>
                <li>Datasets are provided "as is" without warranties</li>
                <li>Prices are in USD and subject to change</li>
                <li>Payment processing is handled securely by Stripe</li>
              </ul>

              <h3 className="text-xl font-bold text-foreground mb-2 mt-4">5.2 Data Usage Rights</h3>
              <p>Purchased datasets may be used for:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Internal research and analysis</li>
                <li>Product development and improvement</li>
                <li>Academic and educational purposes</li>
                <li>Commercial applications (with proper attribution)</li>
              </ul>

              <h3 className="text-xl font-bold text-foreground mb-2 mt-4">5.3 Prohibited Uses</h3>
              <p>You may NOT:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Attempt to re-identify anonymized individuals</li>
                <li>Resell or redistribute datasets without permission</li>
                <li>Use data for discriminatory or harmful purposes</li>
                <li>Violate any applicable data protection laws</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">6. Intellectual Property</h2>
              <p>All platform content, features, and functionality are owned by Data for Earth and protected by international copyright, trademark, and other intellectual property laws.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">7. Prohibited Conduct</h2>
              <p>You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Violate any laws or regulations</li>
                <li>Infringe upon others' intellectual property rights</li>
                <li>Transmit malware, viruses, or malicious code</li>
                <li>Attempt unauthorized access to our systems</li>
                <li>Interfere with platform operation or security</li>
                <li>Impersonate others or provide false information</li>
                <li>Harvest or collect user information</li>
                <li>Use automated systems to access the platform without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">8. Disclaimer of Warranties</h2>
              <p>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Merchantability and fitness for a particular purpose</li>
                <li>Non-infringement of third-party rights</li>
                <li>Accuracy, completeness, or reliability of content</li>
                <li>Uninterrupted or error-free operation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">9. Limitation of Liability</h2>
              <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, DATA FOR EARTH SHALL NOT BE LIABLE FOR:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, revenue, data, or business opportunities</li>
                <li>Damages arising from your use or inability to use the platform</li>
                <li>Third-party content or actions</li>
              </ul>
              <p className="mt-2">Our total liability shall not exceed the amount you paid us in the past 12 months.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">10. Indemnification</h2>
              <p>You agree to indemnify and hold harmless Data for Earth from any claims, damages, losses, liabilities, and expenses arising from:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Your use or misuse of the platform</li>
                <li>Data you contribute or purchase</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">11. Donations</h2>
              <p>All donations are final and non-refundable except as required by law. Donations to environmental projects are directed 100% to verified initiatives.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">12. Governing Law</h2>
              <p>These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to conflict of law principles.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">13. Dispute Resolution</h2>
              <p>Any disputes shall be resolved through binding arbitration in accordance with [Arbitration Rules]. You waive your right to participate in class action lawsuits.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">14. Changes to Terms</h2>
              <p>We reserve the right to modify these Terms at any time. Material changes will be communicated via email or platform notification. Continued use constitutes acceptance of updated terms.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-foreground mb-3">15. Contact Information</h2>
              <p>For questions about these Terms:</p>
              <ul className="list-none space-y-2 mt-2">
                <li><strong>Email:</strong> legal@dataforearth.org</li>
                <li><strong>General Inquiries:</strong> contact@dataforearth.org</li>
                <li><strong>Contact Form:</strong> Available on our Contact page</li>
              </ul>
            </section>

            <section className="border-t-2 border-border pt-6 mt-8">
              <p className="text-sm">
                By using Data for Earth's platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;
