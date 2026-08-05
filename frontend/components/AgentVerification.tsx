"use client";

import { useState, useEffect } from "react";
import { getMyVerificationStatus, applyForVerification, uploadVerificationProof } from "@/lib/api";
import { CheckCircle, Clock, XCircle, ShieldAlert, Upload, Globe } from "lucide-react";

interface VerificationApplication {
  id: number;
  tier: "local" | "international";
  status: "pending" | "approved" | "rejected";
  reviewer_notes?: string;
}

export function AgentVerification({ verificationTier }: { verificationTier: string }) {
  const [apps, setApps] = useState<VerificationApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // In a real app we'd fetch this from backend:
  // For now, we simulate having 5 conversations to unlock. 
  // Wait, the plan says: "Since there's no payment system yet, I'll use number of unique conversations... 
  // I will just mock this for now to True for demonstration, or we can assume it's unlocked."
  const hasMetThreshold = true; 

  const loadStatus = async () => {
    try {
      const res = await getMyVerificationStatus();
      setApps(res);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleApply = async () => {
    if (!file) {
      setError("Please select a photo proof first.");
      return;
    }
    try {
      setUploading(true);
      setError("");
      setSuccess("");
      const { url } = await uploadVerificationProof(file);
      await applyForVerification("local", [url]);
      setSuccess("Application submitted successfully!");
      setFile(null);
      await loadStatus();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to apply");
      } else {
        setError("Failed to apply");
      }
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Loading verification status...</div>;

  const localApp = apps.find(a => a.tier === "local");

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[#1a1a1a] flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-blue-600" />
          Trust & Verification
        </h3>
        <p className="text-gray-500 text-sm mt-1">
          Build trust with renters by verifying your identity and physical presence.
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Tier 1: Local */}
        <div className="p-5 border-b border-gray-200 bg-gray-50/50">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                Local Verified <CheckCircle className="w-4 h-4 text-blue-600" />
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                Show renters you are a verified agent operating in North Cyprus.
              </p>
            </div>
            {verificationTier === "local" || verificationTier === "international" ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Verified</span>
            ) : localApp?.status === "pending" ? (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" /> In Review
              </span>
            ) : localApp?.status === "rejected" ? (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Rejected
              </span>
            ) : null}
          </div>

          {verificationTier !== "local" && verificationTier !== "international" && localApp?.status !== "pending" && (
            <div className="bg-white p-4 rounded border border-gray-200 mt-2">
              {localApp?.status === "rejected" && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
                  <strong>Application Rejected:</strong> {localApp.reviewer_notes || "No reason provided."}
                </div>
              )}
              
              {!hasMetThreshold ? (
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">Unlock Verification</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "60%" }}></div>
                  </div>
                  <p>You need 2 more unique conversations to apply for verification.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    You have unlocked verification! Upload a photo of yourself at one of your listings, or a valid ID.
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      {file ? file.name : "Select Photo"}
                      <input type="file" className="hidden" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                    </label>
                    <button 
                      onClick={handleApply}
                      disabled={uploading || !file}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {uploading ? "Uploading..." : "Submit Application"}
                    </button>
                  </div>
                  {error && <p className="text-red-500 text-xs">{error}</p>}
                  {success && <p className="text-green-600 text-xs">{success}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tier 2: International */}
        <div className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                International Verified <Globe className="w-4 h-4 text-amber-500" />
              </h4>
              <p className="text-sm text-gray-500 mt-1 max-w-md">
                For top-tier agents trusted to handle remote bookings from clients abroad. This is an invite-only tier.
              </p>
            </div>
            {verificationTier === "international" ? (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Premium</span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">Coming Soon</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
