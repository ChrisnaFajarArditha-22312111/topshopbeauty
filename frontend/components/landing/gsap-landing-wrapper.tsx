"use client";

import * as React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface GsapLandingWrapperProps {
  children: React.ReactNode;
}

export function GsapLandingWrapper({ children }: GsapLandingWrapperProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // 1. Scroll Progress Bar at top
      const progressBar = document.getElementById("gsap-scroll-progress");
      if (progressBar) {
        gsap.to(progressBar, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.2,
          },
        });
      }

      // 2. Hero Section Entrance Animation (immediate on page load)
      const heroTl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          gsap.set(
            [
              ".gsap-hero-card",
              ".gsap-hero-badge",
              ".gsap-hero-title",
              ".gsap-hero-desc",
              ".gsap-hero-actions",
              ".gsap-search-capsule",
            ],
            { clearProps: "opacity,transform" }
          );
        },
      });

      heroTl
        .fromTo(
          ".gsap-hero-card",
          { opacity: 0, scale: 0.96, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: 0.7 }
        )
        .fromTo(
          ".gsap-hero-badge",
          { opacity: 0, y: -15 },
          { opacity: 1, y: 0, duration: 0.4 },
          "-=0.4"
        )
        .fromTo(
          ".gsap-hero-title",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5 },
          "-=0.3"
        )
        .fromTo(
          ".gsap-hero-desc",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4 },
          "-=0.3"
        )
        .fromTo(
          ".gsap-hero-actions",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4 },
          "-=0.3"
        )
        .fromTo(
          ".gsap-search-capsule",
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.5 },
          "-=0.2"
        );

      // Parallax scroll on hero background
      gsap.to(".gsap-hero-bg", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: ".gsap-hero-card",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // 3. Category Carousel Section
      gsap.fromTo(
        ".gsap-category-section",
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          immediateRender: false,
          clearProps: "opacity,transform",
          scrollTrigger: {
            trigger: ".gsap-category-section",
            start: "top 95%",
            once: true,
          },
        }
      );

      // 4. Trending Products Section
      gsap.fromTo(
        ".gsap-trending-header",
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          immediateRender: false,
          clearProps: "opacity,transform",
          scrollTrigger: {
            trigger: ".gsap-trending-header",
            start: "top 95%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        ".gsap-product-card",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
          immediateRender: false,
          clearProps: "opacity,transform",
          scrollTrigger: {
            trigger: ".gsap-products-grid",
            start: "top 95%",
            once: true,
          },
        }
      );

      // 5. 3 Golden Steps (How It Works) Section
      gsap.fromTo(
        ".gsap-steps-header",
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          immediateRender: false,
          clearProps: "opacity,transform",
          scrollTrigger: {
            trigger: ".gsap-steps-header",
            start: "top 95%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        ".gsap-step-card",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          duration: 0.6,
          ease: "power2.out",
          immediateRender: false,
          clearProps: "opacity,transform",
          scrollTrigger: {
            trigger: ".gsap-steps-grid",
            start: "top 95%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        ".gsap-steps-cta",
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "power2.out",
          immediateRender: false,
          clearProps: "opacity,transform",
          scrollTrigger: {
            trigger: ".gsap-steps-cta",
            start: "top 98%",
            once: true,
          },
        }
      );

      // 6. AI Beauty Advisor Banner
      gsap.fromTo(
        ".gsap-advisor-banner",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          immediateRender: false,
          clearProps: "opacity,transform",
          scrollTrigger: {
            trigger: ".gsap-advisor-banner",
            start: "top 95%",
            once: true,
          },
        }
      );

      // Subtle float animation on badge
      gsap.to(".gsap-float-badge", {
        y: -4,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Refresh ScrollTrigger after a slight delay for dynamic layouts
      const refreshTimeout = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 250);

      return () => {
        clearTimeout(refreshTimeout);
      };
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="relative w-full">
      {/* GSAP Scroll Progress Indicator */}
      <div
        id="gsap-scroll-progress"
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-rose-500 to-primary origin-left z-50 pointer-events-none scale-x-0"
      />
      {children}
    </div>
  );
}
