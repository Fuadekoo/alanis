"use client";

import { useParams } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { Link } from "@heroui/react";
import { Button } from "@/components/ui/heroui";
import Image from "next/image";
import data from "./data.json";
import { Footer } from "./footer";

export default function Home() {
  return (
    <div className="">
      <LandingPage />
      <LandingPage1 />
      <Service data={data.service} />
      <HowTo data={data.howTo} />
      <About data={data.about} />
      <Footer />
    </div>
  );
}

function LandingPage() {
  const { lang } = useParams<{ lang: string }>();

  return (
    <div className="h-dvh p-4 grid place-content-center ">
      <Image
        alt=""
        src={"/al-anis.png"}
        width={3000}
        height={3000}
        className="size-60 content-center place-self-center "
      />
      <p className="text-4xl md:text-7xl font-extrabold text-center ">
        {lang == "am" ? (
          <>
            <span className="text-primary">አል አኒስ</span>{" "}
            <span className="text-secondary">የቁርዓን ማዕከል</span>
          </>
        ) : lang == "or" ? (
          <>
            <span className="text-primary">Al Anis</span>{" "}
            <span className="text-secondary">Giddu-gala Qur&apos;aanaa</span>
          </>
        ) : (
          <>
            <span className="text-primary">Al Anis</span>{" "}
            <span className="text-secondary">Quran Center</span>
          </>
        )}
      </p>
      {lang == "am" ? (
        <p className="text-center text-2xl py-5">
          ቁርአንን <span className="text-secondary-600">መቅራት</span>/
          <span className="text-secondary-600">ማንበብ</span> አልችልም ማለት{" "}
          <span className="text-primary-600">ቀረ</span>!!
        </p>
      ) : lang == "or" ? (
        <p className="text-center text-2xl py-5">
          <span className="text-primary-600">ammas hin gahuu</span> jedhee
          Qur&apos;aana <span className="text-secondary-600">dubbisuu</span> hin
          danda&apos;u jechuu!!
        </p>
      ) : (
        <p className="text-center text-2xl py-5">
          It&apos;s <span className="text-primary-600">no longer enough</span>{" "}
          to say I can&apos;t <span className="text-secondary-600">read</span>{" "}
          the Quran!!
        </p>
      )}
    </div>
  );
}

function LandingPage1() {
  const { lang } = useParams<{ lang: string }>();
  return (
    <div className="h-[calc(100dvh-3.5rem)] p-5 grid content-center justify-center gap-10 ">
      <p className="max-w-4xl text-4xl md:text-7xl  font-extrabold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        {lang == "am"
          ? "ቁርዓንን መቅራት በዚህኛውም ሆነ በቀጣዩ አለም ልቅናን የመጎናፀፊያ ምክንያት ነው"
          : lang == "or"
          ? "Qur&apos;aana qara&apos;uun gammachuu addunyaa fi aakhiraatti argachuuf madda ta&apos;a"
          : "Reciting the Quran is a means of attaining happiness in this world and in the hereafter."}
      </p>
      <p className="max-w-lg place-self-center text-center  ">
        {lang == "am"
          ? "አንድ ባሪያ ቁርዓንን በመቅራቱ ብቻ ሌሊቱን ቆመው ከሚያሳልፉ ባሮች ተርታ ይመደባል "
          : lang == "or"
          ? "Gabrichi Qur&apos;aana qara&apos;uu qofa gochuun warra galgala ka&apos;an keessa lakkaa&apos;ama"
          : "A slave is counted among those who spend the night standing only reciting the Quran."}
      </p>
      <div className="flex gap-y-5 gap-x-10 max-md:flex-col md:justify-center max-md:items-center  ">
        <Button
          as={Link}
          href="#about"
          radius="full"
          variant="flat"
          className="w-60 bg-default-50/30"
        >
          {lang == "am"
            ? "ብዙ ይመልከቱ"
            : lang == "or"
            ? "Dabalataan Baradhu"
            : "Learn More"}
        </Button>
        <Button
          as={Link}
          href={`/${lang}/registration`}
          radius="full"
          color="primary"
          className="w-60"
        >
          {lang == "am"
            ? "ምዝገባ"
            : lang == "or"
            ? "Galmaa&apos;i"
            : "registration"}
        </Button>
        <Button
          as={Link}
          href="#footer"
          radius="full"
          color="primary"
          className="w-60"
        >
          {lang == "am"
            ? "እኛን ያግኙ"
            : lang == "or"
            ? "Nu Quunnami"
            : "Contact Us"}
        </Button>
      </div>
    </div>
  );
}

function About({ data }: { data: string[][] }) {
  const { lang } = useParams<{ lang: string }>();
  return (
    <div className="md:h-dvh pt-40 p-2 md:p-5 xl:p-20 grid md:grid-cols-2 md:max-xl:gap-10 gap-20 overflow-hidden ">
      <Image
        alt=""
        src={"/quran.jpg"}
        width={1000}
        height={1000}
        className="size-72 md:size-[30rem] rounded-2xl place-self-center "
      />
      <div className="">
        <p className="p-10 text-center text-3xl font-extrabold text-primary-600 ">
          {lang == "am"
            ? "ስለ እኛ"
            : lang == "or"
            ? "Waa&apos;ee Keenyaa"
            : "About Us"}
        </p>
        <div className="flex flex-col gap-10 text-xl text-center">
          {data.map(([am, en, orLang], i) => (
            <p key={i + ""} className="">
              {lang == "am" ? am : lang == "or" ? orLang : en}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function Service({ data }: { data: string[][] }) {
  const { lang } = useParams<{ lang: string }>();

  return (
    <div
      id="about"
      className="md:h-dvh pt-28 p-2 md:p-20 grid md:content-center md:justify-center gap-x-10 gap-y-5 "
    >
      <p className="text-primary-600 text-center text-3xl font-extrabold ">
        {lang == "am" ? "አገልግሎት" : lang == "or" ? "Tajaajila" : "Service"}
      </p>
      <div className="grid md:grid-cols-2 gap-x-10 gap-y-10">
        {data.map(([am, en, orLang], i) => (
          <div
            key={i + ""}
            className="p-5 bg-default-50/30 rounded-xl flex gap-2 items-center hover:shadow"
          >
            <span className="p-2 bg-primary/20 rounded-full text-secondary-600">
              <CheckCheck className="size-4 md:size-8" />
            </span>
            <span className="">
              {lang == "am" ? am : lang == "or" ? orLang : en}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HowTo({ data }: { data: string[][] }) {
  const { lang } = useParams<{ lang: string }>();

  return (
    <div className="md:h-dvh p-10 flex gap-20 flex-col justify-center">
      <p className="text-primary-600 text-center text-2xl md:text-3xl font-extrabold ">
        {lang == "am"
          ? "እንዴት መማር ይቻላል"
          : lang == "or"
          ? "Akka Barattu"
          : "How to Learn"}
      </p>
      <div className="grid gap-20 md:grid-cols-3 items-center">
        {data.map(([am, en, orLang], i) => (
          <div key={i + ""} className="flex flex-col gap-5">
            <div className="size-14 place-self-center content-center text-center bg-primary/30 rounded-full text-secondary-600 text-3xl font-bold">
              {i + 1}
            </div>
            <p className="text-center">
              {lang == "am" ? am : lang == "or" ? orLang : en}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
