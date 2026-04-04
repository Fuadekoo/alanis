import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail, MessageSquare, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Support | Al-Anis Tilawa",
  description:
    "Support and Contact Information for Al-Anis Tilawa Educational System",
};

export default function SupportPage({ params }: { params: { lang: string } }) {
  const { lang } = params;
  return (
    <div className="min-h-full bg-default-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-default-100 shadow-sm rounded-2xl overflow-hidden border border-default-200">
        <div className="px-6 py-8 sm:p-10">
          <div className="mb-10 border-b border-default-200 pb-6 text-center">
            <h1 className="text-3xl font-extrabold text-default-900 tracking-tight sm:text-4xl">
              Support Center
            </h1>
            <p className="mt-4 text-lg text-default-500">
              We&apos;re here to help you with any questions or issues you may
              have.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="p-6 bg-default-50 rounded-xl border border-default-200 flex flex-col items-center text-center">
              <Phone className="size-10 text-primary-600 mb-4" />
              <h3 className="text-xl font-bold text-default-900 mb-2">
                Phone Support
              </h3>
              <p className="text-default-600 mb-4">
                Call us for immediate assistance.
              </p>
              <a
                href="tel:+251924232389"
                className="text-primary-600 font-bold text-lg hover:underline"
              >
                +251924232389
              </a>
            </div>

            <div className="p-6 bg-default-50 rounded-xl border border-default-200 flex flex-col items-center text-center">
              <MessageSquare className="size-10 text-primary-600 mb-4" />
              <h3 className="text-xl font-bold text-default-900 mb-2">
                Telegram Support
              </h3>
              <p className="text-default-600 mb-4">Chat with us on Telegram.</p>
              <a
                href="https://t.me/+251924232389"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 font-bold text-lg hover:underline"
              >
                @AlAnisSupport
              </a>
            </div>

            <div className="p-6 bg-default-50 rounded-xl border border-default-200 flex flex-col items-center text-center">
              <Globe className="size-10 text-primary-600 mb-4" />
              <h3 className="text-xl font-bold text-default-900 mb-2">
                Website
              </h3>
              <p className="text-default-600 mb-4">
                Visit our official website.
              </p>
              <a
                href="https://alanistilawa.com"
                className="text-primary-600 font-bold text-lg hover:underline"
              >
                alanistilawa.com
              </a>
            </div>

            <div className="p-6 bg-default-50 rounded-xl border border-default-200 flex flex-col items-center text-center">
              <Mail className="size-10 text-primary-600 mb-4" />
              <h3 className="text-xl font-bold text-default-900 mb-2">
                Email Support
              </h3>
              <p className="text-default-600 mb-4">
                Send us an email for inquiries.
              </p>
              <a
                href="mailto:support@alanistilawa.com"
                className="text-primary-600 font-bold text-lg hover:underline"
              >
                support@alanistilawa.com
              </a>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none text-default-700 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-default-50 rounded-lg border border-default-100">
                  <h4 className="font-bold text-default-900">
                    How do I register as a student?
                  </h4>
                  <p className="mt-2">
                    You can register by visiting the registration page and
                    filling out the required information. Once registered, our
                    team will review your application.
                  </p>
                </div>
                <div className="p-4 bg-default-50 rounded-lg border border-default-100">
                  <h4 className="font-bold text-default-900">
                    How do I join a class?
                  </h4>
                  <p className="mt-2">
                    Once assigned to a room, you will receive notifications with
                    the Zoom meeting links directly in your student dashboard or
                    via Telegram.
                  </p>
                </div>
                <div className="p-4 bg-default-50 rounded-lg border border-default-100">
                  <h4 className="font-bold text-default-900">
                    What if I forget my password?
                  </h4>
                  <p className="mt-2">
                    Please contact our support team via phone or Telegram to
                    reset your credentials.
                  </p>
                </div>
              </div>
            </section>

            <section className="text-center pt-8 border-t border-default-200">
              <p className="text-default-500">
                Our support team is available from 8:00 AM to 10:00 PM (EAT).
              </p>
            </section>

            <section className="pt-8 border-t border-default-200">
              <h2 className="text-xl font-bold text-default-900 mb-4">
                Quick Links
              </h2>
              <div className="flex flex-wrap gap-4">
                <Link
                  href={`/${lang}/mission`}
                  className="text-primary-600 hover:underline"
                >
                  Mission
                </Link>
                <Link
                  href={`/${lang}/terms`}
                  className="text-primary-600 hover:underline"
                >
                  Terms
                </Link>
                <Link
                  href={`/${lang}/support`}
                  className="text-primary-600 hover:underline"
                >
                  Support
                </Link>
                <Link
                  href={`/${lang}/documentation`}
                  className="text-primary-600 hover:underline"
                >
                  Documentation
                </Link>
                <Link
                  href={`/${lang}/policy`}
                  className="text-primary-600 hover:underline"
                >
                  Privacy Policy
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
