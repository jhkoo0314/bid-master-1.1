import React from "react";
import { CardCore } from "@/types/list";
import { PropertyCard } from "./PropertyCard";

export interface PropertyGridProps {
  items: CardCore[];
}

export const PropertyGrid: React.FC<PropertyGridProps> = ({ items }) => {
  return (
    <section id="list-anchor" className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {items.map((item) => (
          <PropertyCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
};

export default PropertyGrid;


