'use client';

import { FeaturesSection } from "@/components/FeaturesSection";
import HeroSection from "@/components/HeroSection";
import TestimonialGrid from "@/components/Testimonials/TestimonialGrid";
import StatsShowcase from "@/components/StatsShowcase";
import PricingSection from "@/components/PricingSection";
import SubscribeSection from "@/components/SubscribeSection";
import { PageWrapper } from '@/components/ui/page-wrapper';

export default function Home() {
  return (
    <PageWrapper className="flex min-h-screen flex-col font-sans bg-secondary-light dark:bg-secondary-dark">
      <HeroSection />
      <StatsShowcase />
      <FeaturesSection />
      <TestimonialGrid />
      <PricingSection />
      <SubscribeSection />
    </PageWrapper>
  );
}
