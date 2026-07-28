"use client";

import { useOnboarding } from "../../context/OnboardingContext";
import { useState, useRef } from "react";
import { ArrowRight, ArrowLeft, UploadCloud, CheckCircle2 } from "lucide-react";
import { storage } from "../../../../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function StepGST() {
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.hasGST) e.hasGST = "Please select an option";
    if (data.hasGST === "yes") {
      if (!data.gstNumber.trim() || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(data.gstNumber))
        e.gstNumber = "Valid 15-character GSTIN is required";
      if (!data.gstCertificateUrl) e.gstCertificateUrl = "GST Certificate upload is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validate()) setCurrentStep(5); };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, gstCertificateUrl: "File size must be under 10MB" }));
      return;
    }
    const fileExt = file.name.split(".").pop();
    const storageRef = ref(storage, "gst_certificates/" + Date.now() + "_gst." + fileExt);
    setIsUploading(true);
    setUploadProgress(0);
    setErrors((prev) => ({ ...prev, gstCertificateUrl: "" }));
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
      () => {
        setIsUploading(false);
        setErrors((prev) => ({ ...prev, gstCertificateUrl: "Failed to upload file. Please try again." }));
      },
      () => {
        getDownloadURL(task.snapshot.ref).then((url) => {
          updateData({ gstCertificateUrl: url });
          setIsUploading(false);
        });
      }
    );
  };

  const radioCls = (val: string) =>
    "flex-1 cursor-pointer flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all " +
    (data.hasGST === val
      ? "border-brand-charcoal bg-brand-charcoal/5"
      : "border-brand-linen hover:border-brand-charcoal/30");

  const dotCls = (val: string) =>
    "w-5 h-5 rounded-full border-2 flex items-center justify-center " +
    (data.hasGST === val ? "border-brand-charcoal" : "border-brand-charcoal/30");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold text-brand-charcoal mb-2">GST Verification</h2>
        <p className="text-brand-charcoal/60">Help us verify your business entity.</p>
      </div>

      <div className="space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-brand-linen shadow-sm">
        <div>
          <label className="block text-sm font-semibold text-brand-charcoal mb-3">Do you have a GST Number? *</label>
          <div className="flex gap-4">
            <label className={radioCls("yes")}>
              <input type="radio" name="hasGST" value="yes" checked={data.hasGST === "yes"}
                onChange={() => updateData({ hasGST: "yes" })} className="hidden" />
              <div className={dotCls("yes")}>
                {data.hasGST === "yes" && <div className="w-2.5 h-2.5 bg-brand-charcoal rounded-full" />}
              </div>
              <span className="font-semibold text-brand-charcoal">Yes, I have GST</span>
            </label>
            <label className={radioCls("no")}>
              <input type="radio" name="hasGST" value="no" checked={data.hasGST === "no"}
                onChange={() => updateData({ hasGST: "no", gstNumber: "", gstCertificateUrl: "" })} className="hidden" />
              <div className={dotCls("no")}>
                {data.hasGST === "no" && <div className="w-2.5 h-2.5 bg-brand-charcoal rounded-full" />}
              </div>
              <span className="font-semibold text-brand-charcoal">No, I don&apos;t</span>
            </label>
          </div>
          {errors.hasGST && <p className="text-red-500 text-xs mt-2 font-medium">{errors.hasGST}</p>}
        </div>

        {data.hasGST === "yes" && (
          <div className="space-y-6 pt-4 border-t border-brand-linen">
            <div>
              <label htmlFor="gstNumber" className="block text-sm font-semibold text-brand-charcoal mb-1.5">GST Number *</label>
              <input
                id="gstNumber" type="text" maxLength={15} value={data.gstNumber}
                onChange={(e) => updateData({ gstNumber: e.target.value.toUpperCase() })}
                placeholder="22AAAAA0000A1Z5"
                className={
                  "w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 bg-brand-bg/50 transition-all uppercase " +
                  (errors.gstNumber ? "border-red-500 focus:ring-red-500" : "border-brand-linen focus:ring-brand-charcoal")
                }
              />
              {errors.gstNumber && <p className="text-red-500 text-xs mt-1 font-medium">{errors.gstNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-charcoal mb-1.5">GST Certificate Upload *</label>
              <div
                className={
                  "relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer " +
                  (data.gstCertificateUrl
                    ? "border-emerald-500 bg-emerald-50/50"
                    : errors.gstCertificateUrl
                    ? "border-red-500 bg-red-50/50"
                    : "border-brand-linen hover:border-brand-charcoal/40 bg-brand-bg/50")
                }
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
                {isUploading ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-full max-w-xs bg-brand-linen rounded-full h-2">
                      <div className="bg-brand-charcoal h-2 rounded-full transition-all" style={{ width: uploadProgress + "%" }} />
                    </div>
                    <span className="text-sm font-medium text-brand-charcoal/70">Uploading... {Math.round(uploadProgress)}%</span>
                  </div>
                ) : data.gstCertificateUrl ? (
                  <div className="flex flex-col items-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    <span className="font-semibold text-emerald-700">Certificate Uploaded</span>
                    <span className="text-xs text-emerald-600/70">Click to replace</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-2">
                      <UploadCloud className="w-6 h-6 text-brand-charcoal/60" />
                    </div>
                    <span className="font-semibold text-brand-charcoal">Click to upload GST Certificate</span>
                    <span className="text-xs text-brand-charcoal/40">PDF, JPG or PNG (Max 10MB)</span>
                  </div>
                )}
              </div>
              {errors.gstCertificateUrl && <p className="text-red-500 text-xs mt-1 font-medium">{errors.gstCertificateUrl}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={() => setCurrentStep(3)}
          className="flex items-center gap-2 px-6 py-4 text-brand-charcoal font-bold hover:bg-black/5 rounded-xl transition-all">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button onClick={handleNext}
          className="flex items-center gap-2 px-8 py-4 bg-brand-charcoal text-white rounded-xl font-bold hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-md shadow-brand-charcoal/20">
          Continue <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
