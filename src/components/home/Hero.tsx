import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative bg-[url('/hero-bg.webp')] bg-cover bg-center w-full min-h-screen flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.44)]" />
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 max-w-3xl text-center px-4">
        <h1 className="text-5xl font-normal text-white font-noto-sans">More Comfortable, More Classy</h1>
        <p className="text-lg font-light text-white font-poppins leading-[150%]">
        We don't just sell properties, we build futures, create financial freedom, and protect your legacy through real estate, the world's most reliable investment.
        </p>
        <button className="bg-[#1A1F56] text-white px-5 py-3 font-poppins font-normal text-sm leading-[150%] rounded hover:opacity-90 transition-opacity">
          <Link href="/properties">
            Browse Properties
          </Link>
        </button>
      </div>
    </section>
  );
}