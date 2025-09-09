"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Smartphone, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const router = useRouter();

  const isPhoneValid = phoneNumber.trim().length >= 8; // keep loose; adjust per region
  const isOtpReady = otp.trim().length >= 4;

  const handleSendOtp = async () => {
    if (!isPhoneValid) return;
    setIsSending(true);
    setStatusMsg(null);
    try {
      // ⚠️ Hook up your actual OTP API here
      await new Promise((r) => setTimeout(r, 600));
      setStatusMsg("OTP sent. Please check your messages.");
    } catch {
      setStatusMsg("Failed to send OTP. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleLogin = async () => {
    setIsVerifying(true);
    setStatusMsg(null);
    try {
      // Demo check
      if (otp === "1234") {
        router.push("/vehicles");
      } else {
        setStatusMsg("Invalid OTP. Please try again.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isOtpReady) handleLogin();
  };

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,left,rgba(59,130,246,0.18),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(34,197,94,0.18),transparent_45%)] from-blue-500/10 to-emerald-500/10 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-black/5 text-gray-700 text-xs sm:text-sm">
            <ShieldCheck className="h-4 w-4" />
            Secure OTP Login
          </div>
          <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-600">
              LiveX
            </span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Sign in to continue to your dashboard
          </p>
        </div>

        {/* Card */}
        <Card className="backdrop-blur-md bg-white/80 shadow-xl border border-white/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg sm:text-xl">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>
                <div className="mt-1 relative">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    autoComplete="tel"
                    inputMode="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pr-10"
                  />
                  <Smartphone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    disabled={!isPhoneValid || isSending}
                    onClick={handleSendOtp}
                  >
                    {isSending ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </div>
              </div>

              {/* OTP */}
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-700"
                >
                  OTP
                </label>
                <div className="mt-1 relative">
                  <Input
                    id="otp"
                    type={showOtp ? "text" : "password"}
                    placeholder="Enter the 4–6 digit OTP"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={onEnter}
                    className="pr-10 tracking-widest"
                  />
                  <button
                    type="button"
                    aria-label={showOtp ? "Hide OTP" : "Show OTP"}
                    onClick={() => setShowOtp((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700"
                  >
                    {showOtp ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Tip: On mobile, the OTP may autofill.
                </p>
              </div>

              {/* Status message */}
              {statusMsg && (
                <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                  {statusMsg}
                </div>
              )}

              {/* Login button */}
              <Button
                onClick={handleLogin}
                className="w-full h-11 text-base"
                disabled={!isOtpReady || isVerifying}
              >
                {isVerifying ? "Verifying..." : "Login"}
              </Button>

              {/* Footer helper */}
              <p className="text-center text-xs text-gray-500">
                Having trouble? Contact support@livex.app
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
