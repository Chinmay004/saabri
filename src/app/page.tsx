import Hero from "../components/home/Hero";
import Trustedby from "../components/home/Trustedby";
import Features from "../components/home/Features";
import FeaturedAreas from "../components/home/FeaturedAreas";
import Blogs from "../components/home/Blogs";
import Hotspots from "../components/home/Hotspots";
import Testimonials from "../components/home/Testimonials";
import FAQ from "../components/home/FAQ";
import ChatBot from "../components/ChatBot/ChatBot";

export default function Home() {
  return (
    <main className="w-full">
      <Hero />
      <Trustedby />
      <Features />
      <FeaturedAreas />
      <Blogs />
      <Hotspots />
      <ChatBot />
      <Testimonials />
      <FAQ />
    </main>
  );
}
