import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { BookOpen, User, Users, GraduationCap, Video } from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation | Al-Anis Tilawa",
  description:
    "User Guides and Documentation for Al-Anis Tilawa Educational System",
};

export default function DocumentationPage({
  params,
}: {
  params: { lang: string };
}) {
  const { lang } = params;
  return (
    <div className="min-h-full bg-default-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-default-100 shadow-sm rounded-2xl overflow-hidden border border-default-200">
        <div className="px-6 py-8 sm:p-10">
          <div className="mb-10 border-b border-default-200 pb-6">
            <h1 className="text-3xl font-extrabold text-default-900 tracking-tight sm:text-4xl">
              Platform Documentation
            </h1>
            <p className="mt-4 text-lg text-default-500">
              A comprehensive guide on how to use the Al-Anis Tilawa educational
              system.
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none text-default-700 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4 flex items-center gap-2">
                <BookOpen className="size-6 text-primary-600" /> Getting Started
              </h2>
              <p>
                Al-Anis Tilawa is designed to be user-friendly for both teachers
                and students. This documentation covers the core functionalities
                of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4 flex items-center gap-2">
                <Users className="size-6 text-primary-600" /> For Students
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-default-50 rounded-lg border border-default-100">
                  <h4 className="font-bold text-default-900 flex items-center gap-2">
                    <User className="size-4" /> Registration
                  </h4>
                  <p className="mt-2 text-sm text-default-600">
                    Visit the registration page, fill in your personal details
                    (name, phone, gender, etc.), and submit your application.
                  </p>
                </div>
                <div className="p-4 bg-default-50 rounded-lg border border-default-100">
                  <h4 className="font-bold text-default-900 flex items-center gap-2">
                    <Video className="size-4" /> Joining Classes
                  </h4>
                  <p className="mt-2 text-sm text-default-600">
                    Once assigned to a class, login to your dashboard to see
                    scheduled classes. Use the "Join Class" button to open the
                    Zoom meeting.
                  </p>
                </div>
                <div className="p-4 bg-default-50 rounded-lg border border-default-100">
                  <h4 className="font-bold text-default-900 flex items-center gap-2">
                    <GraduationCap className="size-4" /> Progress Tracking
                  </h4>
                  <p className="mt-2 text-sm text-default-600">
                    View your attendance and progress reports in the "Reports"
                    section of your dashboard.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4 flex items-center gap-2">
                <Users className="size-6 text-primary-600" /> For Teachers
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Manage Classes:</strong> Organize your students and
                  assign them to specific study rooms.
                </li>
                <li>
                  <strong>Zoom Integration:</strong> Connect your Zoom account
                  to automatically generate class links.
                </li>
                <li>
                  <strong>Attendance:</strong> Record student attendance during
                  or after each session.
                </li>
                <li>
                  <strong>Announcements:</strong> Send important updates to all
                  students in your classes.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-default-900 mb-4 flex items-center gap-2">
                <Video className="size-6 text-primary-600" /> Zoom Integration
                Guide
              </h2>
              <p>
                Teachers can link their Zoom accounts for seamless class
                creation. Al-Anis Tilawa uses the Zoom API solely to:
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  Generate instant meeting links for scheduled class times.
                </li>
                <li>
                  Share links with students automatically via the dashboard and
                  Telegram.
                </li>
              </ol>
              <p className="mt-4 italic text-sm text-default-500">
                Note: We do not record meetings or access personal Zoom data
                outside of meeting management.
              </p>
            </section>

            <section className="p-6 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
              <h3 className="text-xl font-bold text-primary-900 dark:text-primary-100 mb-2">
                Need more help?
              </h3>
              <p className="text-primary-700 dark:text-primary-300">
                If you have specific technical questions, please visit our{" "}
                <Link href={`/${lang}/support`} className="underline font-bold">
                  Support Center
                </Link>{" "}
                or contact our technical team.
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
