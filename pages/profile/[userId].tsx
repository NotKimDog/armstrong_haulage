"use client";

import { useRouter } from "next/router";
import ProfileView from "../../components/ProfileView";

export default function DynamicProfilePage() {
  const router = useRouter();

  const { userId } = router.query;
  const uid = Array.isArray(userId) ? userId[0] : (userId ?? null);

  // Pass the path param down to ProfileView which will use it before any query/local fallback
  return <ProfileView overrideUserId={uid} />;
}
