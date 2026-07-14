"use server";

import {
  getApproximatePrice,
  getQuotesForRequest,
  type CompanyQuote,
  type QuoteRequest,
} from "@/lib/pricing/engine";

export async function getApproximatePriceAction(
  req: QuoteRequest
): Promise<number | null> {
  try {
    return await getApproximatePrice(req);
  } catch {
    return null;
  }
}

export async function getQuotesAction(
  req: QuoteRequest
): Promise<CompanyQuote[]> {
  return getQuotesForRequest(req);
}
