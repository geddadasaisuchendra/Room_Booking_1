import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100, // INR → paise
      currency: "INR",
      payment_capture: 1, // ✅ AUTO CAPTURE
    });

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: "Order creation failed" });
  }
}
