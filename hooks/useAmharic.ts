import { useParams } from "next/navigation";

export default function useAmharic() {
  const { lang } = useParams<{ lang: string }>();

  return lang == "am";
}
