"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Profile } from "@/lib/data/profile.shared";
import {
  getDeviceCoordinates,
  resolveDiscoveryLocationLabel,
} from "./discovery.client";
import {
  initialDiscoveryFilter,
  initialDiscoveryLocationLabel,
} from "./discovery";
import {
  discoveryLocationLabelSync,
  resolveDiscoveryCenterFromProfile,
  resolveDiscoveryCenterSource,
  resolveDiscoveryFilter,
  type DiscoveryFilter,
} from "./discovery";
import { fetchIpLocation } from "./ip-geo.client";
import type { Coordinates } from "./geo";

type Options = {
  profile: Profile | null | undefined;
  initialProfile: Profile | null | undefined;
  initialIpLocation?: Coordinates | null;
  /** SSR-resolved city label (avoids a Stockholm flash before reverse geocode). */
  initialLabel?: string;
  /** Show city name only — no district/suburb prefix (landing page). */
  cityOnly?: boolean;
};

export function useDiscoveryLocation({
  profile,
  initialProfile,
  initialIpLocation = null,
  initialLabel,
  cityOnly = false,
}: Options) {
  const [gpsLocation, setGpsLocation] = useState<Coordinates | null>(null);
  const [ipLocation, setIpLocation] = useState<Coordinates | null>(
    initialIpLocation,
  );
  const [label, setLabel] = useState(
    () =>
      initialLabel ??
      initialDiscoveryLocationLabel(initialProfile, initialIpLocation),
  );
  const [locateToken, setLocateToken] = useState(0);

  const ssrDiscovery = useMemo(
    () => initialDiscoveryFilter(initialProfile, initialIpLocation),
    [initialIpLocation, initialProfile],
  );

  const resolveFilter = useCallback(
    (nextProfile: Profile | null | undefined) =>
      resolveDiscoveryFilter(nextProfile, gpsLocation, ipLocation),
    [gpsLocation, ipLocation],
  );

  const filter = useMemo(
    () => resolveFilter(profile),
    [profile, resolveFilter],
  );

  // IP fallback for local dev / missing edge headers — never prompts for GPS.
  useEffect(() => {
    if (initialIpLocation) return;
    if (resolveDiscoveryCenterFromProfile(profile)) return;

    let cancelled = false;
    void fetchIpLocation().then(({ coordinates }) => {
      if (!cancelled && coordinates) setIpLocation(coordinates);
    });
    return () => {
      cancelled = true;
    };
  }, [
    initialIpLocation,
    profile?.postal_latitude,
    profile?.postal_longitude,
  ]);

  useEffect(() => {
    const source = resolveDiscoveryCenterSource(profile, gpsLocation, ipLocation);
    const sync = discoveryLocationLabelSync(source, profile);
    if (sync) {
      const frame = requestAnimationFrame(() => setLabel(sync));
      return () => cancelAnimationFrame(frame);
    }

    let cancelled = false;
    void resolveDiscoveryLocationLabel(
      profile,
      gpsLocation,
      ipLocation,
      { cityOnly },
    ).then(
      (nextLabel) => {
        if (!cancelled) setLabel(nextLabel);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [
    profile?.postal_code,
    profile?.postal_latitude,
    profile?.postal_longitude,
    gpsLocation,
    ipLocation,
    cityOnly,
  ]);

  const locate = useCallback(() => {
    setLocateToken((token) => token + 1);
    void getDeviceCoordinates()
      .then(setGpsLocation)
      .catch(() => {
        // Map still flies via locateToken.
      });
  }, []);

  return {
    filter,
    resolveFilter,
    label,
    locateToken,
    locate,
    ssrDiscovery,
  };
}

export type DiscoveryLocation = {
  filter: DiscoveryFilter;
  resolveFilter: (profile: Profile | null | undefined) => DiscoveryFilter;
  label: string;
  locateToken: number;
  locate: () => void;
  ssrDiscovery: DiscoveryFilter;
};
