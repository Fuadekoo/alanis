import React from "react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Al-Anis Tilawa",
  description: "Privacy Policy for Al-Anis Tilawa Educational System",
};

export default function PrivacyPolicyPage({
  params,
}: {
  params: { lang: string };
}) {
  const { lang } = params;
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-default-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-default-100 shadow-sm rounded-2xl overflow-hidden border border-default-200">
        <div className="px-6 py-8 sm:p-10">
          <div className="mb-10 border-b border-default-200 pb-6">
            <h1 className="text-3xl font-extrabold text-default-900 tracking-tight sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-4 text-lg text-default-500">
              Last Updated: {currentDate}
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none text-default-700 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4">
                1. Introduction
              </h2>
              <p>
                Welcome to <strong>Al-Anis Tilawa</strong> ("we," "our," or
                "us"). We are committed to protecting your privacy and ensuring
                you have a positive experience on our educational platform. This
                Privacy Policy applies to our website (alanistilawa.com), our
                educational platform, and our integrations with third-party
                services like Zoom.
              </p>
              <p>
                Al-Anis Tilawa is a free educational system designed to
                facilitate online learning and religious studies between
                teachers and students. We value the trust you place in us and
                take your privacy seriously.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4">
                2. Information We Collect
              </h2>
              <p>
                When you use our platform, we may collect the following types of
                information:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>
                  <strong>Account Information:</strong> Name, phone number,
                  gender, age, country, username, and password when you
                  register.
                </li>
                <li>
                  <strong>Educational Data:</strong> Attendance records, class
                  schedules, and learning progress.
                </li>
                <li>
                  <strong>Zoom Integration Data:</strong> When teachers connect
                  their Zoom accounts to generate class links automatically, we
                  receive and securely store OAuth tokens, Zoom User ID, Zoom
                  Email, and Display Name.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4">
                3. How We Use Your Information
              </h2>
              <p>
                We use the collected information exclusively to provide and
                improve our free educational services:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>
                  To create and manage student, teacher, and administrative
                  accounts.
                </li>
                <li>To schedule and organize online classes.</li>
                <li>
                  <strong>Zoom Integration:</strong> We use the Zoom API solely
                  to generate instant meeting links on behalf of the teacher for
                  scheduled classes and share those links with assigned
                  students. We <strong>do not</strong> access your Zoom
                  contacts, record meetings, or access any other personal Zoom
                  data outside of creating meetings.
                </li>
                <li>
                  To track student progress and attendance for educational
                  reporting.
                </li>
                <li>
                  To send class notifications (e.g., via Telegram) to students.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4">
                4. Third-Party Integrations (Zoom)
              </h2>
              <p>
                Our platform integrates with Zoom to provide seamless virtual
                classrooms. By connecting your Zoom account:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>
                  You authorize Al-Anis Tilawa to create Zoom meetings on your
                  behalf (<code>meeting:write</code> scope).
                </li>
                <li>
                  You authorize us to read your basic profile information (
                  <code>user:read</code> scope) to verify your account.
                </li>
                <li>
                  We do not sell, rent, or share your Zoom data with any third
                  parties.
                </li>
                <li>
                  You can disconnect your Zoom account at any time from your
                  Al-Anis Tilawa profile settings, which will instantly remove
                  our access to your Zoom account and delete the associated
                  tokens from our database.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4">
                5. Data Security & Retention
              </h2>
              <p>
                We implement appropriate technical and organizational security
                measures to protect your personal information against
                unauthorized access, alteration, disclosure, or destruction. We
                retain your personal information only for as long as necessary
                to fulfill the educational purposes outlined in this Privacy
                Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4">
                6. Your Rights
              </h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Access the personal data we hold about you.</li>
                <li>Request corrections to any inaccurate data.</li>
                <li>
                  Request the deletion of your account and associated data.
                </li>
                <li>
                  Revoke third-party app permissions (like Zoom) directly from
                  your profile dashboard at any time.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4">
                7. Children's Privacy
              </h2>
              <p>
                As an educational platform, we may collect information from
                students under the age of 13. This information is collected
                solely for educational purposes and is strictly managed by
                administrators and authorized teachers. We do not use children's
                data for marketing or advertising purposes under any
                circumstances.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4">
                8. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time to reflect
                changes in our practices or for other operational, legal, or
                regulatory reasons. We will notify users of any material changes
                by updating the "Last Updated" date at the top of this page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4">
                9. Contact Us
              </h2>
              <p>
                If you have any questions or concerns about this Privacy Policy
                or our data practices, please contact us at:
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
