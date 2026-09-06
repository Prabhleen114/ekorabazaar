
import { useState, useCallback } from "react";

export interface CheckoutOptions {
  apiCreateRoute: string;
  apiVerifyRoute: string;
  createPayload: Record<string, any>;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  name?: string;
  description?: string;
}

export function useRazorpayCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        return resolve(false);
      }
      if ((window as any).Razorpay) {
        return resolve(true);
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const checkout = useCallback(async (options: CheckoutOptions) => {
    try {
      setIsProcessing(true);

      // Load SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay SDK. Please check your connection.");
      }

      // Step 1: Create Order
      const resCreate = await fetch(options.apiCreateRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options.createPayload),
      });
      
      const createData = await resCreate.json();

      if (!resCreate.ok) {
        throw new Error(createData.error || "Failed to create order");
      }

      // Both /api/checkout/create-order and /api/seller/payment/create-order return razorpayOrderId
      const { razorpayOrderId, orderId, paymentId, amount, currency } = createData;
      
      const rzpOrderId = razorpayOrderId || createData.id;

      // Ensure public key is available
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error("Razorpay configuration is missing.");
      }

      // Step 2: Open Modal
      const rzpOptions = {
        key: keyId,
        amount: amount,
        currency: currency || "INR",
        name: options.name || "Ekora Bazaar",
        description: options.description || "Checkout Payment",
        order_id: rzpOrderId,
        handler: async function (response: any) {
          try {
            // Modal blocks the UI, but handler is async
            const resVerify = await fetch(options.apiVerifyRoute, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
                orderId: orderId, // internal order/payment reference
                paymentId: paymentId
              }),
            });
            
            const verifyData = await resVerify.json();

            if (!resVerify.ok) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }

            if (options.onSuccess) {
              options.onSuccess(verifyData);
            }
          } catch (err: any) {
            console.error("Verification error:", err);
            if (options.onError) {
              options.onError(err.message || "Payment verification failed.");
            }
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            if (options.onError) {
              options.onError("Payment was cancelled.");
            }
          },
        },
        theme: {
          color: "#ea580c", // brand-orange
        },
      };

      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.on("payment.failed", function (response: any) {
        if (options.onError) {
          options.onError(response.error.description || "Payment failed.");
        }
        setIsProcessing(false);
      });

      rzp.open();

    } catch (error: any) {
      console.error("Checkout process error:", error);
      setIsProcessing(false);
      if (options.onError) {
        options.onError(error.message || "An unexpected error occurred.");
      }
    }
  }, []);

  return { checkout, isProcessing };
}

