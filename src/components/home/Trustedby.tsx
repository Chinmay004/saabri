import Image from "next/image";

interface Logo {
    src: string;
    alt: string;
}

export default function Trustedby() {
    const logos = [
        {
            src: "/logo/azizi.webp",
            alt: "Azizi"
        },
        {
            src: "/logo/ellington.webp",
            alt: "Ellington"
        },
        {
            src: "/logo/deyaar.webp",
            alt: "Deyaar"
        },
        {
            src: "/logo/omniyat.webp",
            alt: "Omniyat"
        },
        {
            src: "/logo/mag.webp",
            alt: "MAG"
        },
        {
            src: "/logo/waslproperties.webp",
            alt: "Wasl Properties"
        },
        {
            src: "/logo/arada.webp",
            alt: "Arada"
        }
        
    ]

    return (
        <section className="bg-white my-6 px-4 md:px-6 lg:px-20">
        <div className="container mx-auto flex flex-col">
            <div className="flex flex-row items-center justify-between">
                {logos.map((logo) => (
                    <Image src={logo.src} alt={logo.alt} width={100} height={100} />
                ))}
            </div>
        </div>
        </section>
    );
}