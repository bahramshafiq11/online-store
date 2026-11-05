const CLIENT_URL = () => process.env.CLIENT_URL || "http://localhost:5173";

const formatRs = (n) => `Rs. ${Number(n).toLocaleString("en-US")}`;

// Stop names or addresses containing HTML from breaking (or attacking) the email
const escapeHtml = (text = "") =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const shortId = (order) => order._id.toString().slice(-6).toUpperCase();

// Shared outer layout for all emails
const layout = (content) => `
  <div style="background:#f5f5f7;padding:24px;font-family:Arial,sans-serif;color:#222">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden">
      <div style="background:#1f2937;color:#fff;padding:16px 24px;font-size:20px;font-weight:bold">
        MyStore
      </div>
      <div style="padding:24px">
        ${content}
      </div>
    </div>
    <p style="text-align:center;color:#6b7280;font-size:12px;margin-top:16px">
      You're receiving this because you placed an order at MyStore.
    </p>
  </div>
`;

const orderButton = (order) => `
  <a href="${CLIENT_URL()}/order/${order._id}"
     style="display:inline-block;background:#1f2937;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:16px">
    View your order
  </a>
`;

export const orderConfirmationEmail = (order, user) => {
  const firstName = escapeHtml(user.name.split(" ")[0]);
  const a = order.shippingAddress;

  const nextStep =
    order.paymentMethod === "Online Payment"
      ? "We'll start preparing it as soon as your payment is confirmed."
      : `We'll call you on ${escapeHtml(a.phone)} before delivery.`;

  const rows = order.orderItems
    .map(
      (i) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee">${escapeHtml(i.name)} × ${i.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatRs(i.price * i.quantity)}</td>
        </tr>`
    )
    .join("");

  return {
    subject: `Order confirmed #${shortId(order)}`,
    html: layout(`
      <h2 style="margin:0 0 8px">Thanks for your order, ${firstName}!</h2>
      <p style="margin:0 0 16px;color:#555">
        We've received your order <strong>#${shortId(order)}</strong>. ${nextStep}
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${rows}
        <tr>
          <td style="padding:12px 0;font-weight:bold">Total</td>
          <td style="padding:12px 0;font-weight:bold;text-align:right">${formatRs(order.totalPrice)}</td>
        </tr>
      </table>

      <p style="margin:16px 0 4px;font-weight:bold">Shipping to</p>
      <p style="margin:0;color:#555;line-height:1.6">
        ${escapeHtml(a.fullName)}<br>
        ${escapeHtml(a.address)}<br>
        ${escapeHtml(a.city)}<br>
        ${escapeHtml(a.phone)}
      </p>

      <p style="margin:16px 0 0;color:#555">Payment: ${escapeHtml(order.paymentMethod)}</p>
      ${orderButton(order)}
    `),
  };
};

export const paymentReceivedEmail = (order, user) => {
  const firstName = escapeHtml(user.name.split(" ")[0]);

  return {
    subject: `Payment received for order #${shortId(order)}`,
    html: layout(`
      <h2 style="margin:0 0 8px">Payment received</h2>
      <p style="margin:0 0 8px">Hi ${firstName},</p>
      <p style="margin:0;color:#555">
        We've received your payment of <strong>${formatRs(order.totalPrice)}</strong>
        for order <strong>#${shortId(order)}</strong>. We're getting it ready now.
      </p>
      ${orderButton(order)}
    `),
  };
};

const statusMessages = {
  shipped: {
    title: "Your order is on its way",
    text: "Good news! Your order has been shipped and should reach you soon.",
  },
  delivered: {
    title: "Your order has been delivered",
    text: "Your order has been delivered. We hope you enjoy it! You can now leave a review on the products you bought.",
  },
  cancelled: {
    title: "Your order has been cancelled",
    text: "Your order has been cancelled. If you didn't ask for this, reply to this email and we'll help.",
  },
};

export const statusUpdateEmail = (order, user) => {
  const msg = statusMessages[order.status];
  if (!msg) return null; // no email for other statuses

  const firstName = escapeHtml(user.name.split(" ")[0]);

  return {
    subject: `${msg.title} (#${shortId(order)})`,
    html: layout(`
      <h2 style="margin:0 0 8px">${msg.title}</h2>
      <p style="margin:0 0 8px">Hi ${firstName},</p>
      <p style="margin:0;color:#555">${msg.text}</p>
      <p style="margin:16px 0 0;color:#555">
        Order <strong>#${shortId(order)}</strong> · Total ${formatRs(order.totalPrice)}
      </p>
      ${orderButton(order)}
    `),
  };
};