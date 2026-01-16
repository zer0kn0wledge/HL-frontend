"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { Loader2, Check, AlertCircle, Upload, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useHypurrNFTOwnership, useHypurrNFTs } from "@/hooks/use-hypurr-nft";
import {
  usernameSchema,
  displayNameSchema,
  bioSchema,
} from "@/lib/profile/validation";
import type { HyperID } from "@/types/social";

// ============================================
// Types
// ============================================

type Step = "username" | "avatar" | "privacy";

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (profile: Partial<HyperID>) => void;
}

interface FormData {
  username: string;
  displayName: string;
  bio: string;
  avatar: {
    type: "default" | "upload" | "hypurr";
    url: string;
    hypurrTokenId?: number;
  };
  privacy: {
    showProfile: boolean;
    showPnl: boolean;
    showPositions: boolean;
    showVolume: boolean;
    showOnLeaderboard: boolean;
  };
}

// ============================================
// Username Step
// ============================================

interface UsernameStepProps {
  formData: FormData;
  onChange: (data: Partial<FormData>) => void;
  onNext: () => void;
}

function UsernameStep({ formData, onChange, onNext }: UsernameStepProps) {
  const [usernameError, setUsernameError] = useState<string>();
  const [displayNameError, setDisplayNameError] = useState<string>();
  const [checking, setChecking] = useState(false);

  const validateAndProceed = async () => {
    // Validate username
    const usernameResult = usernameSchema.safeParse(formData.username);
    if (!usernameResult.success) {
      setUsernameError(usernameResult.error.issues[0]?.message);
      return;
    }
    setUsernameError(undefined);

    // Validate display name
    const displayResult = displayNameSchema.safeParse(formData.displayName);
    if (!displayResult.success) {
      setDisplayNameError(displayResult.error.issues[0]?.message);
      return;
    }
    setDisplayNameError(undefined);

    // Check availability (mock - would call API)
    setChecking(true);
    await new Promise((r) => setTimeout(r, 500)); // Simulate API call
    setChecking(false);

    onNext();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            @
          </span>
          <Input
            id="username"
            placeholder="your_username"
            value={formData.username}
            onChange={(e) => {
              onChange({ username: e.target.value.toLowerCase() });
              setUsernameError(undefined);
            }}
            className={cn("pl-7", usernameError && "border-destructive")}
          />
        </div>
        {usernameError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {usernameError}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          3-15 characters, letters, numbers, and underscores only
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          placeholder="Your Display Name"
          value={formData.displayName}
          onChange={(e) => {
            onChange({ displayName: e.target.value });
            setDisplayNameError(undefined);
          }}
          className={cn(displayNameError && "border-destructive")}
        />
        {displayNameError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {displayNameError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio (optional)</Label>
        <Input
          id="bio"
          placeholder="Tell us about yourself..."
          value={formData.bio}
          onChange={(e) => onChange({ bio: e.target.value })}
          maxLength={280}
        />
        <p className="text-xs text-muted-foreground text-right">
          {formData.bio.length}/280
        </p>
      </div>

      <Button onClick={validateAndProceed} className="w-full" disabled={checking}>
        {checking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Continue
      </Button>
    </div>
  );
}

// ============================================
// Avatar Step
// ============================================

interface AvatarStepProps {
  formData: FormData;
  onChange: (data: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function AvatarStep({ formData, onChange, onNext, onBack }: AvatarStepProps) {
  const { address } = useAccount();
  const { hasNFT, tokenIds } = useHypurrNFTOwnership(address);
  const nftQueries = useHypurrNFTs(tokenIds);
  const [avatarType, setAvatarType] = useState(formData.avatar.type);

  const handleSelectType = (type: typeof avatarType) => {
    setAvatarType(type);
    if (type === "default") {
      onChange({
        avatar: {
          type: "default",
          url: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
        },
      });
    }
  };

  const handleSelectHypurr = (tokenId: number, imageUrl: string) => {
    onChange({
      avatar: {
        type: "hypurr",
        url: imageUrl,
        hypurrTokenId: tokenId,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Avatar type selection */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => handleSelectType("default")}
          className={cn(
            "p-4 rounded-lg border-2 transition-all text-center",
            avatarType === "default"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          )}
        >
          <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Generated</p>
          <p className="text-xs text-muted-foreground">Unique avatar</p>
        </button>

        <button
          onClick={() => handleSelectType("upload")}
          className={cn(
            "p-4 rounded-lg border-2 transition-all text-center",
            avatarType === "upload"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          )}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Upload</p>
          <p className="text-xs text-muted-foreground">Your own image</p>
        </button>

        <button
          onClick={() => hasNFT && handleSelectType("hypurr")}
          disabled={!hasNFT}
          className={cn(
            "p-4 rounded-lg border-2 transition-all text-center relative",
            avatarType === "hypurr"
              ? "border-purple-500 bg-purple-500/10"
              : "border-border hover:border-purple-500/50",
            !hasNFT && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className="text-2xl block mb-2">🐱</span>
          <p className="text-sm font-medium">Hypurr NFT</p>
          <p className="text-xs text-muted-foreground">
            {hasNFT ? `${tokenIds.length} owned` : "Not owned"}
          </p>
          {hasNFT && (
            <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">
              VIP
            </span>
          )}
        </button>
      </div>

      {/* Avatar preview/selection */}
      <div className="min-h-[120px]">
        {avatarType === "default" && (
          <div className="flex justify-center">
            <img
              src={`https://api.dicebear.com/7.x/identicon/svg?seed=${address}`}
              alt="Generated avatar"
              className="h-24 w-24 rounded-full border-2 border-border"
            />
          </div>
        )}

        {avatarType === "upload" && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-24 w-24 rounded-full border-2 border-dashed border-border flex items-center justify-center">
              {formData.avatar.url && formData.avatar.type === "upload" ? (
                <img
                  src={formData.avatar.url}
                  alt="Uploaded avatar"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <Button variant="outline" size="sm">
              Choose Image
            </Button>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, or WebP. Max 2MB.
            </p>
          </div>
        )}

        {avatarType === "hypurr" && hasNFT && (
          <div className="grid grid-cols-4 gap-3 max-h-40 overflow-y-auto p-2">
            {nftQueries.map((query, i) => {
              const nft = query.data;
              const isSelected = formData.avatar.hypurrTokenId === nft?.tokenId;

              return (
                <button
                  key={tokenIds[i]}
                  onClick={() =>
                    nft && handleSelectHypurr(nft.tokenId, nft.image)
                  }
                  className={cn(
                    "aspect-square rounded-lg overflow-hidden border-2 transition-all",
                    isSelected
                      ? "border-purple-500 ring-2 ring-purple-500/50"
                      : "border-border hover:border-purple-500/50"
                  )}
                >
                  {query.isLoading ? (
                    <div className="w-full h-full bg-muted animate-pulse" />
                  ) : nft ? (
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      ?
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}

// ============================================
// Privacy Step
// ============================================

interface PrivacyStepProps {
  formData: FormData;
  onChange: (data: Partial<FormData>) => void;
  onSubmit: () => void;
  onBack: () => void;
  isPending: boolean;
}

function PrivacyStep({
  formData,
  onChange,
  onSubmit,
  onBack,
  isPending,
}: PrivacyStepProps) {
  const updatePrivacy = (key: keyof FormData["privacy"], value: boolean) => {
    onChange({
      privacy: {
        ...formData.privacy,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Control what others can see on your profile.
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Public Profile</Label>
            <p className="text-xs text-muted-foreground">
              Allow others to view your profile
            </p>
          </div>
          <Switch
            checked={formData.privacy.showProfile}
            onCheckedChange={(v) => updatePrivacy("showProfile", v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Show PnL</Label>
            <p className="text-xs text-muted-foreground">
              Display your profit/loss on profile
            </p>
          </div>
          <Switch
            checked={formData.privacy.showPnl}
            onCheckedChange={(v) => updatePrivacy("showPnl", v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Show Positions</Label>
            <p className="text-xs text-muted-foreground">
              Show your current open positions
            </p>
          </div>
          <Switch
            checked={formData.privacy.showPositions}
            onCheckedChange={(v) => updatePrivacy("showPositions", v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Show Volume</Label>
            <p className="text-xs text-muted-foreground">
              Display your trading volume
            </p>
          </div>
          <Switch
            checked={formData.privacy.showVolume}
            onCheckedChange={(v) => updatePrivacy("showVolume", v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Appear on Leaderboards</Label>
            <p className="text-xs text-muted-foreground">
              Show on public leaderboards
            </p>
          </div>
          <Switch
            checked={formData.privacy.showOnLeaderboard}
            onCheckedChange={(v) => updatePrivacy("showOnLeaderboard", v)}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onSubmit} disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create Profile
        </Button>
      </div>
    </div>
  );
}

// ============================================
// Main Modal Component
// ============================================

export function CreateProfileModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProfileModalProps) {
  const { address } = useAccount();
  const [step, setStep] = useState<Step>("username");
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    username: "",
    displayName: "",
    bio: "",
    avatar: {
      type: "default",
      url: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
    },
    privacy: {
      showProfile: true,
      showPnl: true,
      showPositions: false,
      showVolume: true,
      showOnLeaderboard: true,
    },
  });

  const updateFormData = useCallback((data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const handleSubmit = async () => {
    setIsPending(true);
    try {
      // In production, this would call the API to create the profile
      await new Promise((r) => setTimeout(r, 1000)); // Simulate API call

      toast.success("Profile created successfully!");
      onSuccess?.(formData as Partial<HyperID>);
      onClose();
    } catch (error) {
      toast.error("Failed to create profile");
    } finally {
      setIsPending(false);
    }
  };

  const steps: Step[] = ["username", "avatar", "privacy"];
  const currentIndex = steps.indexOf(step);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Your HyperID</DialogTitle>
          <DialogDescription>
            Set up your trading identity on HyperTerminal
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-4">
          {steps.map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded",
                i <= currentIndex ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Step content */}
        {step === "username" && (
          <UsernameStep
            formData={formData}
            onChange={updateFormData}
            onNext={() => setStep("avatar")}
          />
        )}

        {step === "avatar" && (
          <AvatarStep
            formData={formData}
            onChange={updateFormData}
            onNext={() => setStep("privacy")}
            onBack={() => setStep("username")}
          />
        )}

        {step === "privacy" && (
          <PrivacyStep
            formData={formData}
            onChange={updateFormData}
            onSubmit={handleSubmit}
            onBack={() => setStep("avatar")}
            isPending={isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
