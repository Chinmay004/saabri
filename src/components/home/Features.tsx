"use client";

import { useState, useEffect, useRef } from "react";

interface Feature {
  value: string;
  label: string;
}

function useCountAnimation(
  targetValue: string,
  duration: number = 2000,
  isVisible: boolean
): string {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Parse the target value to get the numeric value
  const parseTargetValue = (value: string): number => {
    const cleanValue = value.replace(/[^0-9K]/g, "");
    if (cleanValue.includes("K")) {
      return parseInt(cleanValue.replace("K", "")) * 1000;
    }
    return parseInt(cleanValue) || 0;
  };

  // Format the number back to the original format
  const formatValue = (num: number, originalValue: string): string => {
    if (originalValue.includes("K")) {
      const kValue = Math.floor(num / 1000);
      return `+${kValue}K`;
    }
    return `+${Math.floor(num)}`;
  };

  useEffect(() => {
    if (!isVisible) {
      setCount(0);
      return;
    }

    const targetNum = parseTargetValue(targetValue);
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = startValue + (targetNum - startValue) * easeOutQuart;

      setCount(currentCount);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(targetNum);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      startTimeRef.current = null;
    };
  }, [targetValue, duration, isVisible]);

  return formatValue(count, targetValue);
}

function useIntersectionObserver(
  ref: React.RefObject<HTMLElement | null>,
  threshold: number = 0.1
): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref, threshold]);

  return isVisible;
}

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useIntersectionObserver(sectionRef, 0.2);

  const features: Feature[] = [
    {
      value: "+100",
      label: "Units Ready"
    },
    {
      value: "+60K",
      label: "Customers"
    },
    {
      value: "+70K",
      label: "Review"
    }
  ];

  return (
    <section ref={sectionRef} className="bg-white p-[80px]">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-[3px] items-start">
          {/* Left Section - Title */}
          <h2 className="font-medium text-[#12161D] font-noto-sans text-[44px] leading-[52px] w-full lg:w-[520px] shrink-0">
            Enjoy Quality Life in Perumnas Housing
          </h2>

          {/* Right Section */}
          <div className="flex flex-col gap-[80px] grow items-start w-full lg:w-auto">
            {/* Paragraph */}
            <p className="font-normal text-[#61656E] font-poppins text-[20px] leading-[1.36] w-full">
              Sabri is the right choice for those of you who are looking for comfortable, safe and affordable housing. With the cluster concept, you can enjoy the privacy and comfort of living in a beautiful and clean environment. Apart from that, you can also enjoy the various facilities provided, such as playgrounds, sports fields, shopping centers, schools, and others.
            </p>

            {/* Key Features */}
            <div className="flex flex-row justify-between items-start w-full">
              {features.map((feature, index) => (
                <AnimatedFeature
                  key={index}
                  feature={feature}
                  isVisible={isVisible}
                  delay={index * 200}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnimatedFeature({
  feature,
  isVisible,
  delay = 0
}: {
  feature: Feature;
  isVisible: boolean;
  delay?: number;
}) {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, delay]);

  const animatedValue = useCountAnimation(feature.value, 2000, shouldAnimate);

  return (
    <div className="flex flex-col gap-[12px] grow basis-0 items-start">
      <p className="font-medium text-[#12161D] font-noto-sans text-[36px] leading-[48px] w-full">
        {animatedValue}
      </p>
      <p className="font-normal text-[#61656E] font-poppins text-[18px] leading-[26px] w-full">
        {feature.label}
      </p>
    </div>
  );
}

