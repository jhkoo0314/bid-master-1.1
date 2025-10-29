"use client";

import React from "react";
import { CardCore } from "@/types/list";
import { PropertyCard } from "./PropertyCard";

export interface MobileCarouselProps {
  items: CardCore[];
}

export const MobileCarousel: React.FC<MobileCarouselProps> = ({ items }) => {
  return (
    <section
      aria-roledescription="carousel"
      aria-live="polite"
      className="sm:hidden overflow-x-auto snap-x snap-mandatory px-4 py-6 space-x-4 flex"
    >
      {items.map((item) => (
        <div key={item.id} className="min-w-[85%] snap-center">
          <PropertyCard item={item} />
        </div>
      ))}
    </section>
  );
};

export default MobileCarousel;


