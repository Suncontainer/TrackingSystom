"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getTrackingUrl, lookupTrackingOrder } from "./lookup";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function lookupTrackingAction(formData: FormData) {
  const result = await lookupTrackingOrder(
    {
      email: readString(formData, "email"),
      identifier: readString(formData, "identifier"),
      turnstileToken: readString(formData, "cf-turnstile-response") || readString(formData, "turnstileToken")
    },
    await headers()
  );

  if (!result.ok) {
    redirect("/?lookup=failed");
  }

  redirect(getTrackingUrl(result.token));
}
