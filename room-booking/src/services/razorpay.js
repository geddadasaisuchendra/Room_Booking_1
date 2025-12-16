export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const openRazorpayPayment = async ({
  amount,
  name,
  phone,
  date,
  timeSlot,
  onSuccess,
  onFailure
}) => {
  const res = await loadRazorpayScript();
  if (!res) {
    alert("Razorpay SDK failed to load.");
    onFailure && onFailure();
    return;
  }

  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY,
    amount: amount * 100,
    currency: "INR",
    name: "Room Booking",
    description: `Booking for ${date} (${timeSlot})`,

    prefill: {
      name,
      contact: phone
    },

    handler: function (response) {
      // ✅ Payment success
      onSuccess(response);
    },

    modal: {
      ondismiss: function () {
        // ❌ User closed popup
        onFailure && onFailure();
      }
    }
  };

  const paymentObject = new window.Razorpay(options);

  // ❌ Explicit payment failure
  paymentObject.on("payment.failed", function () {
    onFailure && onFailure();
  });

  paymentObject.open();
};
