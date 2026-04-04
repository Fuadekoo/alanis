import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Target, Heart, BookOpen, GraduationCap } from "lucide-react";

export const metadata: Metadata = {
  title: "Mission | Al-Anis Tilawa",
  description: "Mission and Vision of Al-Anis Tilawa Educational System",
};

export default function MissionPage({ params }: { params: { lang: string } }) {
  const { lang } = params;
  return (
    <div className="min-h-full bg-default-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-default-100 shadow-sm rounded-2xl overflow-hidden border border-default-200">
        <div className="px-6 py-8 sm:p-10">
          <div className="mb-10 border-b border-default-200 pb-6 text-center">
            <h1 className="text-3xl font-extrabold text-default-900 tracking-tight sm:text-4xl">
              Our Mission & Vision
            </h1>
            <p className="mt-4 text-lg text-default-500 italic">
              Empowering learners through the beauty of the Quran.
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none text-default-700 space-y-12">
            <section className="text-center">
              <div className="flex justify-center mb-4">
                <Target className="size-12 text-primary-600" />
              </div>
              <h2 className="text-3xl font-bold text-default-900 mb-4">
                Our Mission
              </h2>
              <p className="text-xl text-default-700 leading-relaxed">
                To provide a high-quality, accessible, and modern educational
                platform for learning the Quran and religious studies, bridging
                the gap between teachers and students worldwide through
                innovative technology.
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-default-50 rounded-xl border border-default-200">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="size-6 text-red-500" />
                  <h3 className="text-xl font-bold text-default-900">
                    Our Values
                  </h3>
                </div>
                <ul className="list-disc pl-6 space-y-2 text-default-700">
                  <li>
                    <strong>Authenticity:</strong> Committed to the original and
                    correct recitation of the Quran.
                  </li>
                  <li>
                    <strong>Accessibility:</strong> Making religious education
                    available to everyone, everywhere.
                  </li>
                  <li>
                    <strong>Integrity:</strong> Upholding the highest standards
                    of teaching and data privacy.
                  </li>
                  <li>
                    <strong>Community:</strong> Building a supportive
                    environment for students and teachers.
                  </li>
                </ul>
              </div>

              <div className="p-6 bg-default-50 rounded-xl border border-default-200">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="size-6 text-primary-600" />
                  <h3 className="text-xl font-bold text-default-900">
                    Our Vision
                  </h3>
                </div>
                <p className="text-default-700">
                  To become the leading global digital platform for Quranic
                  studies, recognized for excellence in Tajweed and Hifz
                  education, and for our contribution to spiritual growth
                  through technology.
                </p>
              </div>
            </div>

            <section className="bg-primary-50 dark:bg-primary-900/20 p-8 rounded-2xl border border-primary-100 dark:border-primary-800 text-center">
              <div className="flex justify-center mb-4">
                <GraduationCap className="size-12 text-primary-700 dark:text-primary-300" />
              </div>
              <h2 className="text-2xl font-bold text-primary-900 dark:text-primary-100 mb-4">
                What We Offer
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-lg mx-auto">
                <div className="flex items-start gap-2">
                  <span className="text-primary-600 font-bold">✓</span>
                  <p className="text-primary-800 dark:text-primary-200">
                    Qualified Quranic Instructors
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary-600 font-bold">✓</span>
                  <p className="text-primary-800 dark:text-primary-200">
                    Interactive Online Classrooms
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary-600 font-bold">✓</span>
                  <p className="text-primary-800 dark:text-primary-200">
                    Progress Reports & Certificates
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary-600 font-bold">✓</span>
                  <p className="text-primary-800 dark:text-primary-200">
                    Flexible Scheduling
                  </p>
                </div>
              </div>
            </section>

            <section className="text-center pt-8">
              <p className="text-default-500 italic">
                &quot;The best among you are those who learn the Quran and teach
                it.&quot; - Prophet Muhammad (ﷺ)
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
