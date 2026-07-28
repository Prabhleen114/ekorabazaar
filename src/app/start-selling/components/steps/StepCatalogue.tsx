"use client";

import { useOnboarding } from "../../context/OnboardingContext";
import { useState } from "react";
import { ArrowRight, ArrowLeft, UploadCloud, CheckCircle2, Info } from "lucide-react";
import { storage } from "../../../../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function StepCatalogue() {
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validate = () => {
    const hasAnyCatalogue =
      data.catalogueUrl || data.driveLink || data.dropboxLink || data.otherLink;
    if (!hasAnyCatalogue) {
      setErrors({ catalogue: "Please provide your product catalogue (upload a file or share a link)" });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => { if (validate()) setCurrentStep(8); };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setErrors({ catalogue: "File size must be under 100MB" });
      return;
    }
    const fileExt = file.name.split(".").pop();
    const storageRef = ref(storage, "catalogues/" + Date.now() + "_catalogue." + fileExt);
    setIsUploading(true);
    setUploadProgress(0);
    setErrors({});
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100 || 1),
      () => {
        setIsUploading(false);
        setErrors({ catalogue: "Failed to upload file. Please try again or provide a Drive link." });
      },
      () => {
        getDownloadURL(task.snapshot.ref).then((url) => {
          updateData({ catalogueUrl: url });
          setIsUploading(false);
        });
      }
    );
  };

  const zoneCls =
    "relative border-2 border-dashed rounded-xl p-8 text-center transition-colors " +
    (data.catalogueUrl
      ? "border-emerald-500 bg-emerald-50/50"
      : "border-brand-linen hover:border-brand-charcoal/40 bg-brand-bg/50");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold text-brand-charcoal mb-2">Catalogue Upload</h2>
        <p className="text-brand-charcoal/60">Share your products. We&apos;ll handle the listing process.</p>
      </div>

      <div className="space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-brand-linen shadow-sm">
        <div className="bg-brand-charcoal text-white rounded-2xl p-5 sm:p-6 shadow-md">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-brand-orange flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-lg mb-1">Sit back and relax.</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                We will professionally create and optimize your Ekora storefront using the catalogue you provide.
                Our onboarding team will verify your documents and list your products within{" "}
                <strong className="text-white">24 hours</strong> after successful verification and payment.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand-charcoal mb-2">Upload Catalogue File (Max 100MB)</label>
          <div className={zoneCls}>
            <input
              type="file" onChange={handleFileUpload}
              accept=".pdf,.ppt,.pptx,.xls,.xlsx,.zip"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            {isUploading ? (
              <div className="flex flex-col items-center space-y-3 pointer-events-none">
                <div className="w-full max-w-sm bg-brand-linen rounded-full h-2">
                  <div className="bg-brand-charcoal h-2 rounded-full transition-all" style={{ width: uploadProgress + "%" }} />
                </div>
                <span className="text-sm font-medium text-brand-charcoal/70">Uploading... {Math.round(uploadProgress)}%</span>
              </div>
            ) : data.catalogueUrl ? (
              <div className="flex flex-col items-center space-y-2 pointer-events-none">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                <span className="font-bold text-emerald-700 text-lg">Catalogue Uploaded Successfully</span>
                <span className="text-sm text-emerald-600/70">Click or drag to replace file</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2 pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-2">
                  <UploadCloud className="w-8 h-8 text-brand-charcoal/60" />
                </div>
                <span className="font-bold text-brand-charcoal text-lg">Drag &amp; Drop or Browse Files</span>
                <span className="text-sm text-brand-charcoal/50">Supports PDF, PPT, Excel, or ZIP folders</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 my-2">
          <div className="flex-1 h-px bg-brand-linen" />
          <span className="text-xs font-bold text-brand-charcoal/40 uppercase tracking-widest">OR PROVIDE LINKS</span>
          <div className="flex-1 h-px bg-brand-linen" />
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="driveLink" className="block text-sm font-semibold text-brand-charcoal mb-1.5">
              Google Drive Link <span className="text-brand-charcoal/40 font-normal">(Make sure it&apos;s accessible)</span>
            </label>
            <input id="driveLink" type="url" value={data.driveLink}
              onChange={(e) => updateData({ driveLink: e.target.value })}
              placeholder="https://drive.google.com/..."
              className="w-full px-4 py-3 rounded-xl border border-brand-linen focus:outline-none focus:ring-2 focus:ring-brand-charcoal bg-brand-bg/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="dropboxLink" className="block text-sm font-semibold text-brand-charcoal mb-1.5">Dropbox Link</label>
              <input id="dropboxLink" type="url" value={data.dropboxLink}
                onChange={(e) => updateData({ dropboxLink: e.target.value })}
                placeholder="https://dropbox.com/..."
                className="w-full px-4 py-3 rounded-xl border border-brand-linen focus:outline-none focus:ring-2 focus:ring-brand-charcoal bg-brand-bg/50 transition-all"
              />
            </div>
            <div>
              <label htmlFor="otherLink" className="block text-sm font-semibold text-brand-charcoal mb-1.5">Other URL (e.g. Notion, Canva)</label>
              <input id="otherLink" type="url" value={data.otherLink}
                onChange={(e) => updateData({ otherLink: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl border border-brand-linen focus:outline-none focus:ring-2 focus:ring-brand-charcoal bg-brand-bg/50 transition-all"
              />
            </div>
          </div>
        </div>

        {errors.catalogue && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm font-medium">{errors.catalogue}</p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={() => setCurrentStep(6)}
          className="flex items-center gap-2 px-6 py-4 text-brand-charcoal font-bold hover:bg-black/5 rounded-xl transition-all">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button onClick={handleNext}
          className="flex items-center gap-2 px-8 py-4 bg-brand-charcoal text-white rounded-xl font-bold hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-md shadow-brand-charcoal/20">
          Review Application <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
