
import { useState, useCallback } from "react";

export interface CheckoutOptions {
  apiCreateRoute: string;
  apiVerifyRoute: string;
  createPayload: Record<string, any>;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

let scriptPromise: Promise<boolean> | null = null;

const preloadRazorpayScript = (): Promise<boolean> => {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }
  if ((window as any).Razorpay) {
    return Promise.resolve(true);
  }
  if (scriptPromise) {
    return scriptPromise;
  }
  scriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      scriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
};

export function useRazorpayCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);

  // Eagerly preload the script when the hook is used (e.g. on mount of the checkout/cart page)
  if (typeof window !== "undefined") {
    preloadRazorpayScript().catch(() => {});
  }

  const loadRazorpayScript = preloadRazorpayScript;

  const checkout = useCallback(async (options: CheckoutOptions) => {
    try {
      console.log("[CHECKOUT] click", performance.now());
      setIsProcessing(true);

      // Load SDK
      const scriptLoadStart = performance.now();
      const scriptLoaded = await loadRazorpayScript();
      console.log(`[CHECKOUT] Razorpay SDK ready. Took: ${performance.now() - scriptLoadStart}ms`);
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay SDK. Please check your connection.");
      }

      // Step 1: Create Order
      const createStart = performance.now();
      console.log("[CHECKOUT] create-order request start");
      const resCreate = await fetch(options.apiCreateRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options.createPayload),
      });
      
      const createData = await resCreate.json();
      console.log(`[CHECKOUT] create-order response. Took: ${performance.now() - createStart}ms`, createData);

      // Guest user ?" redirect to /login and return to this product page after sign-in
      if (resCreate.status === 401) {
        setIsProcessing(false);
        const returnUrl = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?redirect=${returnUrl}`;
        return;
      }

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
        prefill: {
          name: options.prefill?.name || createData.customer?.name || "",
          email: options.prefill?.email || createData.customer?.email || "",
          contact: options.prefill?.contact || createData.customer?.phone || "",
        },
        callback_url: `${window.location.origin}/api/checkout/callback`,
        redirect: true,
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
            
            let verifyData;
            try {
              verifyData = await resVerify.json();
            } catch (jsonErr) {
              // If it's a 500 error or Vercel proxy error, it might not be JSON
              throw new Error(`Server returned status ${resVerify.status} during verification. Please check your order history.`);
            }

            if (!resVerify.ok) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }

            // Step 4: Verification Success
            setIsProcessing(false);
            if (options.onSuccess) {
              options.onSuccess(verifyData);
            }
          } catch (err: any) {
            console.error("Verification error:", err);
            
            let errorMsg = err.message || "Payment verification failed due to network error.";
            // Specific Adblocker/Network drop check
            if (errorMsg === "Failed to fetch") {
              errorMsg = "Network error or request blocked by an extension. Your payment is safe and will be synced shortly. Please check your order history.";
            }

            if (options.onError) {
              options.onError(errorMsg);
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
          color: "#252525", // Ekora charcoal
          backdrop_color: "#F8F6F2", // warm off-white
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI",
                instruments: [{ method: "upi" }],
              },
              other: {
                name: "Other Payment Modes",
                instruments: [{ method: "card" }, { method: "netbanking" }, { method: "wallet" }],
              },
            },
            sequence: ["block.upi", "block.other"],
            preferences: {
              show_default_blocks: true,
            },
          },
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

