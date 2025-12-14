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
}) => {
  const res = await loadRazorpayScript();
  if (!res) {
    alert("Razorpay SDK failed to load.");
    return;
  }

  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY,
    amount: amount * 100,
    currency: "INR",
    name: "Room Booking",
    description: "Booking Payment",
    prefill: {
      name,
      contact: phone,
    },

    handler: function (response) {
      onSuccess(response);
    },
  };

  const paymentObject = new window.Razorpay(options);
  paymentObject.open();
};
