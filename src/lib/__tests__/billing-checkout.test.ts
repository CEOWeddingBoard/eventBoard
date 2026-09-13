import { buildCheckoutSessionCreateParams } from "@/lib/billing-checkout";
import { CHECKOUT_PRODUCT_NAME, PRICE_MONTHLY_PLN } from "@/lib/billing";

describe("billing-checkout", () => {
  describe("buildCheckoutSessionCreateParams", () => {
    const base = {
      checkoutCustomerId: "cus_checkout_new",
      clerkUserId: "user_abc",
      locale: "pl" as const,
      successUrl: "https://weddingboard.pl/pl/dashboard?payment=success",
      cancelUrl: "https://weddingboard.pl/pl/dashboard?payment=cancel",
      trialPeriodDays: 30,
    };

    it("creates monthly subscription via price_data when STRIPE_PRICE_ID unset", () => {
      const params = buildCheckoutSessionCreateParams({
        ...base,
        includeTrial: true,
      });
      const line = params.line_items?.[0]?.price_data;
      expect(line?.unit_amount).toBe(PRICE_MONTHLY_PLN);
      expect(line?.tax_behavior).toBe("inclusive");
      expect(line?.recurring?.interval).toBe("month");
      expect(line?.product_data?.name).toBe(CHECKOUT_PRODUCT_NAME);
      expect(params.payment_method_collection).toBe("always");
    });

    it("uses catalog price when STRIPE_PRICE_ID is set", () => {
      process.env.STRIPE_PRICE_ID = "price_test_monthly";
      const params = buildCheckoutSessionCreateParams({
        ...base,
        includeTrial: true,
      });
      expect(params.line_items?.[0]?.price).toBe("price_test_monthly");
      expect(params.line_items?.[0]?.price_data).toBeUndefined();
      delete process.env.STRIPE_PRICE_ID;
    });

    it("collects billing address without unsupported checkout invoice_settings", () => {
      const params = buildCheckoutSessionCreateParams({
        ...base,
        includeTrial: false,
      });
      expect(params.customer).toBe("cus_checkout_new");
      expect(params.locale).toBe("pl");
      expect(params.billing_address_collection).toBe("required");
      expect(params.customer_update).toEqual({ address: "auto", name: "auto" });
      expect(params.tax_id_collection).toBeUndefined();
      expect(params.subscription_data?.invoice_settings).toBeUndefined();
    });

    it("sets trial on first subscription only", () => {
      const withTrial = buildCheckoutSessionCreateParams({
        ...base,
        includeTrial: true,
      });
      expect(withTrial.subscription_data?.trial_period_days).toBe(30);

      const noTrial = buildCheckoutSessionCreateParams({
        ...base,
        includeTrial: false,
      });
      expect(noTrial.subscription_data?.trial_period_days).toBeUndefined();
    });

    it("includes clerkUserId in metadata", () => {
      const params = buildCheckoutSessionCreateParams({
        ...base,
        includeTrial: false,
      });
      expect(params.metadata).toEqual({ clerkUserId: "user_abc" });
      expect(params.subscription_data?.metadata).toEqual({ clerkUserId: "user_abc" });
    });
  });
});
