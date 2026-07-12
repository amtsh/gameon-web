"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { MapPin } from "lucide-react";
import { useDiscoveryLocation } from "@/lib/location/use-discovery-location.client";
import type { Coordinates } from "@/lib/location/geo";
import { DEFAULT_DISCOVERY_CITY } from "@/lib/location/constants";

const LandingCityContext = createContext<string>(DEFAULT_DISCOVERY_CITY);

type ProviderProps = {
  initialIpLocation?: Coordinates | null;
  initialLabel?: string;
  children: ReactNode;
};

/** One discovery resolution for the whole landing page (IP → reverse geocode → default). */
export function LandingLocationProvider({
  initialIpLocation = null,
  initialLabel,
  children,
}: ProviderProps) {
  const { label } = useDiscoveryLocation({
    profile: null,
    initialProfile: null,
    initialIpLocation,
    initialLabel,
    cityOnly: true,
  });

  return (
    <LandingCityContext.Provider value={label}>
      {children}
    </LandingCityContext.Provider>
  );
}

type CityProps = {
  className?: string;
  showIcon?: boolean;
  iconSize?: number;
};

export function LandingCity({
  className,
  showIcon = true,
  iconSize = 14,
}: CityProps) {
  const label = useContext(LandingCityContext);

  return (
    <span className={className}>
      {showIcon ? (
        <MapPin size={iconSize} strokeWidth={2.25} aria-hidden />
      ) : null}
      {label}
    </span>
  );
}
