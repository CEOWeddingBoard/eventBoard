/**
 * @jest-environment node
 */
jest.mock("@/lib/auth/utils", () => ({
  getCurrentUser: jest.fn(async () => null),
}));

import { getClerkUserEmail, getClerkUserFullName, type AppUser } from "@/lib/clerk-user";

function makeUser(overrides: Partial<AppUser> = {}): AppUser {
  return {
    id: "user_1",
    emailAddresses: [{ id: "primary", emailAddress: "test@example.com" }],
    primaryEmailAddressId: "primary",
    firstName: "Anna",
    lastName: "Kowalska",
    username: null,
    ...overrides,
  };
}

describe("clerk-user helpers", () => {
  it("getClerkUserEmail returns primary email", () => {
    expect(getClerkUserEmail(makeUser())).toBe("test@example.com");
  });

  it("getClerkUserEmail falls back to first address", () => {
    const user = makeUser({ primaryEmailAddressId: "other" });
    expect(getClerkUserEmail(user)).toBe("test@example.com");
  });

  it("getClerkUserEmail returns undefined without addresses", () => {
    expect(getClerkUserEmail(makeUser({ emailAddresses: [] }))).toBeUndefined();
  });

  it("getClerkUserFullName joins first and last name", () => {
    expect(getClerkUserFullName(makeUser())).toBe("Anna Kowalska");
  });

  it("getClerkUserFullName falls back to first name only", () => {
    expect(getClerkUserFullName(makeUser({ lastName: null }))).toBe("Anna");
  });
});
