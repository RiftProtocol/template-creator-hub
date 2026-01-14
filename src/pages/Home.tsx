import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import Hero from "@/components/home/Hero";

export default function Home() {
  return (
    <div className="relative w-full">
      <Header />
      <Hero />
      <Footer />
    </div>
  );
}
