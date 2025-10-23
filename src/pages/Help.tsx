import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, Book, Shield, CreditCard, Users, Database, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Help = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      category: "Getting Started",
      icon: Book,
      questions: [
        {
          q: "How do I contribute data?",
          a: "Visit our Contribute page, fill out the form with your information, and submit. Your data is immediately processed by our AI system, organized, and prepared for the marketplace. You'll receive a confirmation once processing is complete."
        },
        {
          q: "Is my data secure?",
          a: "Absolutely. We use enterprise-grade encryption, secure database storage with Row-Level Security (RLS), comprehensive audit logging, and comply with GDPR, CCPA, and international data protection standards. All data is anonymized before being made available for purchase."
        },
        {
          q: "How do I create an account?",
          a: "Click the Login button in the navigation, then switch to the Sign Up tab. Enter your email and password to create an account. For organizations, you can add additional details in your profile settings after signing up."
        }
      ]
    },
    {
      category: "Data Marketplace",
      icon: Database,
      questions: [
        {
          q: "How do I purchase datasets?",
          a: "Browse available datasets in our Marketplace, click on a dataset you're interested in, and click 'Purchase Dataset'. You'll be redirected to our secure Stripe checkout. After payment, you'll receive immediate access to download the data."
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept all major credit cards, debit cards, and digital wallets through Stripe, including Visa, Mastercard, American Express, Apple Pay, and Google Pay."
        },
        {
          q: "Can I get a refund?",
          a: "Refunds are handled on a case-by-case basis. Contact our support team with your purchase details, and we'll review your request. Generally, refunds are provided if there's a technical issue with the dataset."
        },
        {
          q: "What data formats are available?",
          a: "Datasets are provided in industry-standard formats including JSON, CSV, and SQL exports, depending on the dataset type."
        }
      ]
    },
    {
      category: "Organizations",
      icon: Users,
      questions: [
        {
          q: "How can my organization get involved?",
          a: "Organizations can contribute data, purchase datasets, or partner with us for environmental initiatives. Visit our Contact page and select 'Partnership Opportunity' to learn more about collaboration options."
        },
        {
          q: "Do you offer bulk pricing?",
          a: "Yes! Organizations purchasing multiple datasets or requiring custom data collection can contact us for volume discounts and enterprise packages."
        },
        {
          q: "Is there an organization verification process?",
          a: "Yes, organizations can be verified to access premium features. After signing up, complete your organization profile with business details, and our team will review your verification request within 48 hours."
        }
      ]
    },
    {
      category: "Privacy & Security",
      icon: Shield,
      questions: [
        {
          q: "How is contributed data anonymized?",
          a: "Our AI system automatically removes personally identifiable information (PII) before data enters the marketplace. Data is aggregated and processed to ensure individual privacy while maintaining analytical value."
        },
        {
          q: "What data protection standards do you follow?",
          a: "We comply with GDPR (EU), CCPA (California), PIPEDA (Canada), and other international data protection regulations. We maintain SOC 2 compliance and conduct regular security audits."
        },
        {
          q: "Can I delete my contributed data?",
          a: "Yes, you have the right to request deletion of your contributed data. Contact support with your submission details, and we'll process your request within 30 days as required by law."
        },
        {
          q: "How do you prevent data breaches?",
          a: "We implement multiple security layers including encryption at rest and in transit, regular penetration testing, automated security monitoring, role-based access control, and comprehensive audit logging of all system access."
        }
      ]
    },
    {
      category: "Payments & Donations",
      icon: CreditCard,
      questions: [
        {
          q: "Where does my donation go?",
          a: "Donations to 'Platform Operations' support our hosting, development, and maintenance. Donations to 'Environmental Projects' go 100% to verified environmental and climate action initiatives."
        },
        {
          q: "Can I set up recurring donations?",
          a: "Yes! When making a donation, select 'Monthly Donation' to become a sustainer. You'll be charged automatically each month, and you can cancel anytime through the Stripe customer portal."
        },
        {
          q: "Are receipts provided?",
          a: "Yes, you'll receive an email receipt immediately after every donation or purchase, and you can access all your transaction history through your account."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <HelpCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-5xl font-black mb-4 text-gradient">Help Center</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Find answers to common questions or contact our support team
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          {faqs.map((category, idx) => {
            const Icon = category.icon;
            return (
              <div key={idx} className="bg-card border-2 border-border rounded-xl p-8 hover-lift">
                <div className="flex items-center gap-3 mb-6">
                  <Icon className="w-8 h-8 text-primary" />
                  <h2 className="text-2xl font-black">{category.category}</h2>
                </div>

                <Accordion type="single" collapsible className="space-y-4">
                  {category.questions.map((faq, qIdx) => (
                    <AccordionItem key={qIdx} value={`${idx}-${qIdx}`} className="border-2 border-border rounded-lg px-4">
                      <AccordionTrigger className="font-bold hover:text-primary">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 rounded-xl p-8 text-center"
        >
          <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-4">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help!
          </p>
          <Button
            size="lg"
            className="border-glow hover-lift font-black"
            onClick={() => navigate("/contact")}
          >
            Contact Support
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Help;
