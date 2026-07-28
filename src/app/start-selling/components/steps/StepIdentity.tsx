"use client";

import { useOnboarding } from "../../context/OnboardingContext";
import { useState } from "react";
import { ArrowRight, ArrowLeft, UploadCloud, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { storage } from "../../../../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

type DocumentType = "panCardUrl" | "aadhaarCardUrl" | "businessLogoUrl" | "profilePhotoUrl";

export default function StepIdentity() {
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingState, setUploadingState] = useState<Record<string, number>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.panCardUrl) e.panCardUrl = "PAN Card upload is required";
    if (!data.aadhaarCardUrl) e.aadhaarCardUrl = "Aadhaar Card upload is required";
    if (!data.businessLogoUrl) e.businessLogoUrl = "Business Logo is required";
    if (!data.profilePhotoUrl) e.profilePhotoUrl = "Profile Photo is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validate()) setCurrentStep(7); };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: DocumentType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [type]: "File size must be under 10MB" }));
      return;
    }
    const fileExt = file.name.split(".").pop();
    const storageRef = ref(storage, "identity/" + type + "_" + Date.now() + "." + fileExt);
    setUploadingState((prev) => ({ ...prev, [type]: 1 }));
    setErrors((prev) => ({ ...prev, [type]: "" }));
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      (snap) => setUploadingState((prev) => ({ ...prev, [type]: (snap.bytesTransferred / snap.totalBytes) * 100 || 1 })),
      () => {
        setUploadingState((prev) => ({ ...prev, [type]: 0 }));
        setErrors((prev) => ({ ...prev, [type]: "Failed to upload file." }));
      },
      () => {
        getDownloadURL(task.snapshot.ref).then((url) => {
          updateData({ [type]: url });
          setUploadingState((prev) => ({ ...prev, [type]: 0 }));
        });
      }
    );
  };

  const FileUploader = ({
    type, label, description, accept, isImageOnly,
  }: { type: DocumentType; label: string; description: string; accept: string; isImageOnly?: boolean }) => {
    const progress = uploadingState[type] ?? 0;
    const isUploading = progress > 0;
    const isUploaded = !!data[type];
    const error = errors[type];

    const zoneCls =
      "relative border-2 border-dashed rounded-xl p-6 text-center transition-colors " +
      (isUploaded
        ? "border-emerald-500 bg-emerald-50/50"
        : error
        ? "border-red-500 bg-red-50/50"
        : "border-brand-linen hover:border-brand-charcoal/40 bg-brand-bg/50");

    return (
      <div>
        <label className="block text-sm font-semibold text-brand-charcoal mb-1.5">{label} *</label>
        <div className={zoneCls}>
          <input
            type="file" onChange={(e) => handleFileUpload(e, type)} accept={accept}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isUploading}
          />
          {isUploading ? (
            <div className="flex flex-col items-center space-y-3 pointer-events-none">
              <div className="w-full max-w-xs bg-brand-linen rounded-full h-2">
                <div className="bg-brand-charcoal h-2 rounded-full transition-all" style={{ width: progress + "%" }} />
              </div>
              <span className="text-sm font-medium text-brand-charcoal/70">Uploading... {Math.round(progress)}%</span>
            </div>
          ) : isUploaded ? (
            <div className="flex flex-col items-center space-y-2 pointer-events-none">
              {isImageOnly ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-emerald-200">
                  <img src={data[type]} alt={label} className="w-full h-full object-cover" />
                </div>
              ) : (
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              )}
              <span className="font-semibold text-emerald-700">Uploaded Successfully</span>
              <span className="text-xs text-emerald-600/70">Click to replace</span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2 pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-1">
                {isImageOnly ? <ImageIcon className="w-5 h-5 text-brand-charcoal/60" /> : <UploadCloud className="w-5 h-5 text-brand-charcoal/60" />}
              </div>
              <span className="font-semibold text-brand-charcoal">Upload {label}</span>
              <span className="text-xs text-brand-charcoal/40">{description}</span>
            </div>
          )}
        </div>
        {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold text-brand-charcoal mb-2">Identity &amp; Brand</h2>
        <p className="text-brand-charcoal/60">Upload your identity documents and brand assets.</p>
      </div>

      <div className="space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-brand-linen shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUploader type="panCardUrl" label="PAN Card" description="PDF, JPG or PNG (Max 10MB)" accept=".pdf,.jpg,.jpeg,.png" />
          <FileUploader type="aadhaarCardUrl" label="Aadhaar Card (Front & Back)" description="PDF, JPG or PNG (Max 10MB)" accept=".pdf,.jpg,.jpeg,.png" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-brand-linen">
          <FileUploader type="businessLogoUrl" label="Business Logo" description="High-res JPG or PNG (Square recommended)" accept=".jpg,.jpeg,.png" isImageOnly />
          <FileUploader type="profilePhotoUrl" label="Creator Profile Photo" description="High-res photo of you (JPG or PNG)" accept=".jpg,.jpeg,.png" isImageOnly />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={() => setCurrentStep(5)}
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
