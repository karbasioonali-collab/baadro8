import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-only-insecure-secret"
);

const SESSION_TTL = "30d";

export type CustomerSessionPayload = {
  kind: "customer";
  userId: string;
  mobile: string;
};

export type StaffSessionPayload = {
  kind: "staff";
  employeeId: string;
  isFullAdmin: boolean;
};

export type CompanySessionPayload = {
  kind: "company";
  companyAccountId: string;
  companyId: string;
};

export type SessionPayload =
  | CustomerSessionPayload
  | StaffSessionPayload
  | CompanySessionPayload;

const COOKIE_NAMES = {
  customer: "badro_customer_session",
  staff: "badro_staff_session",
  company: "badro_company_session",
} as const;

async function sign(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secretKey);
}

async function verify<T extends SessionPayload>(
  token: string
): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as T;
  } catch {
    return null;
  }
}

export async function createCustomerSession(
  data: Omit<CustomerSessionPayload, "kind">
) {
  const token = await sign({ kind: "customer", ...data });
  const store = await cookies();
  store.set(COOKIE_NAMES.customer, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function createStaffSession(
  data: Omit<StaffSessionPayload, "kind">
) {
  const token = await sign({ kind: "staff", ...data });
  const store = await cookies();
  store.set(COOKIE_NAMES.staff, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function createCompanySession(
  data: Omit<CompanySessionPayload, "kind">
) {
  const token = await sign({ kind: "company", ...data });
  const store = await cookies();
  store.set(COOKIE_NAMES.company, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getCustomerSession(): Promise<CustomerSessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAMES.customer)?.value;
  if (!token) return null;
  return verify<CustomerSessionPayload>(token);
}

export async function getStaffSession(): Promise<StaffSessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAMES.staff)?.value;
  if (!token) return null;
  return verify<StaffSessionPayload>(token);
}

export async function getCompanySession(): Promise<CompanySessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAMES.company)?.value;
  if (!token) return null;
  return verify<CompanySessionPayload>(token);
}

export async function destroySession(kind: "customer" | "staff" | "company") {
  const store = await cookies();
  store.delete(COOKIE_NAMES[kind]);
}

export { COOKIE_NAMES };

/** برای استفاده در middleware (بدون دسترسی به next/headers cookies()) */
export async function verifySessionToken<T extends SessionPayload>(
  token: string
): Promise<T | null> {
  return verify<T>(token);
}
