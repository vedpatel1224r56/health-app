const createPaymentGatewayService = ({ fetch, crypto, razorpayKeyId = "", razorpayKeySecret = "" }) => {
  const enabled = Boolean(String(razorpayKeyId || "").trim() && String(razorpayKeySecret || "").trim());

  const assertEnabled = () => {
    if (!enabled) {
      const error = new Error("Online payment gateway is not configured.");
      error.statusCode = 503;
      throw error;
    }
  };

  const createRazorpayOrder = async ({ amountPaise, receipt, notes = {} }) => {
    assertEnabled();
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt,
        notes,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        payload?.error?.description ||
        payload?.error?.message ||
        payload?.message ||
        "Unable to create payment order.";
      const error = new Error(message);
      error.statusCode = response.status || 502;
      throw error;
    }
    return payload;
  };

  const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
    assertEnabled();
    const digest = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    return digest === String(signature || "");
  };

  return {
    enabled,
    publicConfig: enabled
      ? {
          provider: "razorpay",
          keyId: razorpayKeyId,
        }
      : {
          provider: "razorpay",
          keyId: "",
        },
    createRazorpayOrder,
    verifyRazorpaySignature,
  };
};

module.exports = { createPaymentGatewayService };
