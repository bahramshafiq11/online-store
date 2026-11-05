import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useSearchParams, Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function OrderPage() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const justPlaced = location.state?.justPlaced;
  const payment = searchParams.get("payment");
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState("");
  const [justPaid, setJustPaid] = useState(false);
  const autoChecked = useRef(false);

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch((err) => setError(err.response?.data?.message || "Could not load order"));
  }, [id]);

  const checkPayment = async (silent = false) => {
    setChecking(true);
    if (!silent) setCheckMessage("");
    try {
      const res = await api.post(`/payments/${id}/verify`);
      if (res.data.isPaid) {
        setOrder((prev) => ({ ...prev, isPaid: true, paidAt: res.data.paidAt }));
        setJustPaid(true);
        setCheckMessage("");
      } else if (!silent) {
        setCheckMessage(
          "Safepay hasn't confirmed this payment yet. If you just paid, wait a few seconds and check again."
        );
      }
    } catch (err) {
      if (!silent) setCheckMessage(err.response?.data?.message || "Could not check the payment");
    } finally {
      setChecking(false);
    }
  };

  // When an unpaid online order is opened, quietly check with Safepay once
  useEffect(() => {
    if (!order || autoChecked.current) return;
    const needsCheck =
      order.paymentMethod === "Online Payment" &&
      !order.isPaid &&
      order.status !== "cancelled" &&
      order.paymentResult?.tracker;
    if (needsCheck) {
      autoChecked.current = true;
      checkPayment(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order? This can't be undone.")) return;

    setCancelling(true);
    try {
      const res = await api.put(`/orders/${id}/cancel`);
      setOrder((prev) => ({ ...prev, status: res.data.status }));
    } catch (err) {
      alert(err.response?.data?.message || "Could not cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const handlePayNow = async () => {
    setPaying(true);
    try {
      const res = await api.post(`/payments/${id}/start`);
      window.location.href = res.data.url;
    } catch (err) {
      alert(err.response?.data?.message || "Could not open the payment page");
      setPaying(false);
    }
  };

  if (error) return <p className="status error">{error}</p>;
  if (!order) return <p className="status">Loading order...</p>;

  const a = order.shippingAddress;
  const isOwner = order.user?._id === user?._id;
  const isOnline = order.paymentMethod === "Online Payment";
  const unpaidOnline = isOnline && !order.isPaid && order.status !== "cancelled";
  const canCancel = isOwner && order.status === "pending" && !order.isPaid;
  const canPay = isOwner && unpaidOnline;
  const canCheck = unpaidOnline && order.paymentResult?.tracker;

  return (
    <div>
      {justPaid && (
        <p className="success-box">Payment received. Thank you! Your order is confirmed.</p>
      )}
      {checking && <p className="info-box">Checking your payment with Safepay...</p>}
      {checkMessage && !checking && <p className="info-box">{checkMessage}</p>}

      {payment === "cancelled" && !order.isPaid && !checking && (
        <p className="info-box">
          You left the payment page before paying. Your order is saved, so you can pay with the
          Pay now button.
        </p>
      )}
      {payment === "notstarted" && !order.isPaid && (
        <p className="info-box">
          Your order is saved, but we couldn't open the payment page. Use Pay now to try again.
        </p>
      )}
      {justPlaced && order.status === "pending" && !isOnline && (
        <p className="success-box">
          Order placed. Thank you! We'll call you on {a.phone} before delivery.
        </p>
      )}

      <h1>Order #{order._id.slice(-6).toUpperCase()}</h1>

      <div className="cart-layout">
        <div className="panel">
          <h2>Items</h2>
          {order.orderItems.map((item) => (
            <div className="order-line" key={item._id}>
              <span>{item.name} × {item.quantity}</span>
              <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}

          <h2 className="section-gap">Shipping to</h2>
          <p className="address">
            {a.fullName}<br />
            {a.address}<br />
            {a.city}<br />
            {a.phone}
          </p>
        </div>

        <div className="cart-summary">
          <h3>Summary</h3>
          <div className="summary-row">
            <span>Status</span>
            <span className={`pill ${order.status}`}>{order.status}</span>
          </div>
          <div className="summary-row">
            <span>Payment</span>
            <span>{order.paymentMethod}</span>
          </div>
          {isOnline && (
            <div className="summary-row">
              <span>Paid</span>
              <span className={`pill ${order.isPaid ? "paid" : "unpaid"}`}>
                {order.isPaid
                  ? `Paid ${new Date(order.paidAt).toLocaleDateString()}`
                  : "Not paid"}
              </span>
            </div>
          )}
          <div className="summary-row">
            <span>Placed on</span>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>Rs. {order.totalPrice.toLocaleString()}</span>
          </div>

          {canCheck && (
            <button
              className="btn secondary full"
              onClick={() => checkPayment(false)}
              disabled={checking}
            >
              {checking ? "Checking..." : "Check payment status"}
            </button>
          )}
          {canPay && (
            <button className="btn full" onClick={handlePayNow} disabled={paying}>
              {paying ? "Opening payment page..." : "Pay now"}
            </button>
          )}
          {canCancel && (
            <button className="btn secondary full" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "Cancelling..." : "Cancel order"}
            </button>
          )}
          <Link to="/my-orders" className="btn full">View all my orders</Link>
        </div>
      </div>
    </div>
  );
}