import React from "react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and Conditions | Al-Anis Tilawa",
  description: "Terms and Conditions for Al-Anis Tilawa Educational System",
};

export default function TermsPage({ params }: { params: { lang: string } }) {
  const { lang } = params;
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-full bg-default-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-default-100 shadow-sm rounded-2xl overflow-hidden border border-default-200">
        <div className="px-6 py-8 sm:p-10">
          <div className="mb-10 border-b border-default-200 pb-6">
            <h1 className="text-3xl font-extrabold text-default-900 tracking-tight sm:text-4xl">
              Terms and Conditions
            </h1>
            <p className="mt-4 text-lg text-default-500">
              Last Updated: {currentDate}
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none text-default-700 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using the <strong>Al-Anis Tilawa</strong>{" "}
                platform, you agree to be bound by these Terms and Conditions.
                If you do not agree to all of these terms, please do not use our
                services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4">
                2. Description of Service
              </h2>
              <p>
                Al-Anis Tilawa is a free educational system designed to
                facilitate online learning and religious studies. We provide
                tools for teachers to organize classes and for students to learn
                the Quran and related studies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4">
                3. User Responsibilities
              </h2>
              <p>Users are responsible for:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Providing accurate information during registration.</li>
                <li>Maintaining the security of their account credentials.</li>
                <li>
                  Ensuring that their use of the platform complies with all
                  applicable laws and regulations.
                </li>
                <li>
                  Behaving respectfully towards other users and instructors.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4">
                4. Prohibited Activities
              </h2>
              <p>Users may not:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Use the platform for any illegal purpose.</li>
                <li>Share account access with unauthorized users.</li>
                <li>Harass or abuse other users.</li>
                <li>Attempt to gain unauthorized access to our systems.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4">
                5. Intellectual Property
              </h2>
              <p>
                All content provided on the Al-Anis Tilawa platform, including
                but not limited to text, graphics, logos, and software, is the
                property of Al-Anis Tilawa or its content suppliers and is
                protected by international copyright laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4">
                6. Limitation of Liability
              </h2>
              <p>
                Al-Anis Tilawa is provided &quot;as is&quot; and &quot;as
                available&quot; without any warranties. We shall not be liable
                for any direct, indirect, incidental, special, or consequential
                damages resulting from the use or inability to use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4">
                7. Termination
              </h2>
              <p>
                We reserve the right to terminate or suspend your access to the
                platform at our sole discretion, without notice, for conduct
                that we believe violates these Terms and Conditions or is
                harmful to other users or us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4">
                8. Changes to Terms
              </h2>
              <p>
                We may modify these Terms and Conditions at any time. Your
                continued use of the platform after such modifications
                constitutes your acceptance of the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4">
                9. Contact Us
              </h2>
              <p>
                If you have any questions about these Terms and Conditions,
                please contact us at:
              </p>
              <div className="mt-4 bg-default-100 p-4 rounded-lg inline-block">
                <p>
                  <strong>Al-Anis Tilawa Support</strong>
                </p>
                <p>Phone: +251924232389</p>
                <p>Website: alanistilawa.com</p>
              </div>
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
