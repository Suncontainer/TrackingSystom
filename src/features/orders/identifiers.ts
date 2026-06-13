import { randomInt } from "node:crypto";

import { sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { orderNumberCounters } from "@/db/schema";
import { ConflictError, ValidationError } from "@/lib/errors/app-error";

const ORDER_NUMBER_PREFIX = "SC";
const ORDER_NUMBER_SEQUENCE_WIDTH = 6;
const TRACKING_GROUP_LENGTH = 4;
const TRACKING_GROUP_COUNT = 3;
const TRACKING_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type DatabaseLike = Pick<ReturnType<typeof getDb>, "execute">;

export function getOrderNumberConfig() {
  return {
    prefix: ORDER_NUMBER_PREFIX,
    sequenceWidth: ORDER_NUMBER_SEQUENCE_WIDTH
  } as const;
}

export function formatOrderNumber(year: number, sequence: number, prefix = ORDER_NUMBER_PREFIX) {
  return `${prefix}-${year}-${String(sequence).padStart(ORDER_NUMBER_SEQUENCE_WIDTH, "0")}`;
}

export function normalizeManualOrderNumber(orderNumber: string) {
  return orderNumber.trim().toUpperCase();
}

export function validateManualOrderNumber(orderNumber: string) {
  const normalized = normalizeManualOrderNumber(orderNumber);

  if (!/^[A-Z]{2,10}-\d{4}-\d{6}$/.test(normalized)) {
    throw new ValidationError("Manual order number format is invalid.", {
      manualOrderNumber: ["Format must look like SC-2026-000001."]
    });
  }

  return normalized;
}

export async function issueNextOrderNumber(tx: DatabaseLike, year = new Date().getUTCFullYear()) {
  const result = await tx.execute(sql<{ issued_value: number; prefix: string; year: number }>`
    insert into ${orderNumberCounters} ("year", "prefix", "next_value", "created_at", "updated_at")
    values (${year}, ${ORDER_NUMBER_PREFIX}, 2, now(), now())
    on conflict ("year")
    do update
      set "next_value" = ${orderNumberCounters.nextValue} + 1,
          "updated_at" = now()
    returning "prefix", "year", "next_value" - 1 as issued_value
  `);

  const row = result[0];

  if (!row) {
    throw new ConflictError("Unable to allocate the next order number.");
  }

  return formatOrderNumber(Number(row.year), Number(row.issued_value), String(row.prefix));
}

function generateTrackingBody() {
  const characters: string[] = [];

  for (let index = 0; index < TRACKING_GROUP_LENGTH * TRACKING_GROUP_COUNT; index += 1) {
    characters.push(TRACKING_ALPHABET.charAt(randomInt(0, TRACKING_ALPHABET.length)));
  }

  return characters.join("");
}

export function normalizeTrackingNumber(input: string) {
  return input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function formatTrackingNumber(normalizedTrackingNumber: string) {
  const compact = normalizeTrackingNumber(normalizedTrackingNumber);
  const body = compact.startsWith("SC") ? compact.slice(2) : compact;
  const groups = body.match(/.{1,4}/g) ?? [];

  return ["SC", ...groups].join("-");
}

export function generateTrackingNumber() {
  return `SC${generateTrackingBody()}`;
}
