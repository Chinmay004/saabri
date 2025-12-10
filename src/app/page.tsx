import Hero from "../components/home/Hero";
import Trustedby from "../components/home/Trustedby";
import Features from "../components/home/Features";

export default function Home() {
  return (
    <main className="w-full">
      <Hero />
      <Trustedby />
      <Features />
    </main>
  );
}
