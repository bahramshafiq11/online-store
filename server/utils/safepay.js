const env = () => process.env.SAFEPAY_ENV || "sandbox";

const API_BASE = () =>
  env() === "production" ? "https://api.getsafepay.com" : "https://sandbox.api.getsafepay.com";

const CHECKOUT_BASE = () =>
  env() === "production"
    ? "https://getsafepay.com/checkout/pay"
    : "https://sandbox.api.getsafepay.com/checkout/pay";

export const safepayConfigured = () =>
  Boolean(process.env.SAFEPAY_PUBLIC_KEY && process.env.SAFEPAY_SECRET_KEY);

// Step 1: ask Safepay to start a payment. Returns a "tracker" token.
export const createTracker = async (amount) => {
  const res = await fetch(`${API_BASE()}/order/v1/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount,
      client: process.env.SAFEPAY_PUBLIC_KEY,
      currency: "PKR",
      environment: env(),
    }),
  });

  const json = await res.json().catch(() => null);
  const token = json?.data?.token;

  if (!res.ok || !token) {
    const reason = json?.status?.errors?.join(", ") || `status ${res.status}`;
    throw new Error(`Safepay could not start the payment (${reason})`);
  }
  return token;
};

// Step 2: build the link to Safepay's payment page
export const checkoutUrl = ({ token, orderId, redirectUrl, cancelUrl }) => {
  const params = new URLSearchParams({
    beacon: token,
    cancel_url: cancelUrl,
    env: env(),
    order_id: orderId,
    redirect_url: redirectUrl,
    source: "custom",
    webhooks: "false",
  });
  return `${CHECKOUT_BASE()}?${params}`;
};

// Step 3: ask Safepay what happened to a payment (same v1 API that created it)
export const fetchTrackerStatus = async (tracker) => {
  const res = await fetch(`${API_BASE()}/order/v1/${encodeURIComponent(tracker)}`, {
    headers: { "X-SFPY-MERCHANT-SECRET": process.env.SAFEPAY_SECRET_KEY },
  });

  const json = await res.json().catch(() => null);
  const t = json?.data;

  if (!res.ok || !t) {
    const reason = json?.message || `status ${res.status}`;
    throw new Error(`Safepay status lookup failed (${reason})`);
  }

  // The payment must belong to our own Safepay account
  if (t.client !== process.env.SAFEPAY_PUBLIC_KEY) {
    return { state: "WRONG_MERCHANT", amount: t.amount, currency: t.currency };
  }

  return { state: t.state, amount: t.amount, currency: t.currency };
};

// Safepay's v1 API reports the amount in rupees, the same way we sent it
export const amountMatches = (reported, orderTotal) => Number(reported) === Number(orderTotal);