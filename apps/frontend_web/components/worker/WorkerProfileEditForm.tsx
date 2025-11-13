"use client";

import { useState, useEffect } from "react";
import { useUpdateWorkerProfile } from "@/lib/hooks/useWorkerProfile";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface WorkerProfileEditFormProps {
  initialData?: {
    bio?: string;
    description?: string;
    hourly_rate?: number;
  };
}

export function WorkerProfileEditForm({
  initialData,
}: WorkerProfileEditFormProps) {
  const [bio, setBio] = useState(initialData?.bio || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [hourlyRate, setHourlyRate] = useState(
    initialData?.hourly_rate?.toString() || ""
  );
  const [hasChanges, setHasChanges] = useState(false);

  const { mutate: updateProfile, isPending } = useUpdateWorkerProfile();

  // Track if form has changes
  useEffect(() => {
    const changed =
      bio !== (initialData?.bio || "") ||
      description !== (initialData?.description || "") ||
      hourlyRate !== (initialData?.hourly_rate?.toString() || "");
    setHasChanges(changed);
  }, [bio, description, hourlyRate, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: {
      bio?: string;
      description?: string;
      hourly_rate?: number;
    } = {};

    if (bio) data.bio = bio;
    if (description) data.description = description;
    if (hourlyRate) data.hourly_rate = parseFloat(hourlyRate);

    updateProfile(data, {
      onSuccess: () => {
        setHasChanges(false);
      },
    });
  };

  const bioLength = bio.length;
  const descriptionLength = description.length;
  const maxBioLength = 200;
  const maxDescriptionLength = 350;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Bio Section */}
      <div className="space-y-2">
        <Label htmlFor="bio">
          Bio <span className="text-sm text-gray-500">(Optional)</span>
        </Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, maxBioLength))}
          placeholder="Write a brief bio about yourself..."
          className="min-h-[80px]"
          maxLength={maxBioLength}
        />
        <div className="flex justify-between text-sm">
          <p className="text-gray-500">
            A short introduction that clients will see first
          </p>
          <p
            className={`${
              bioLength >= maxBioLength ? "text-red-600" : "text-gray-500"
            }`}
          >
            {bioLength}/{maxBioLength}
          </p>
        </div>
      </div>

      {/* Description Section */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-sm text-gray-500">(Optional)</span>
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) =>
            setDescription(e.target.value.slice(0, maxDescriptionLength))
          }
          placeholder="Describe your skills, experience, and what makes you stand out..."
          className="min-h-[120px]"
          maxLength={maxDescriptionLength}
        />
        <div className="flex justify-between text-sm">
          <p className="text-gray-500">
            Detailed information about your expertise and services
          </p>
          <p
            className={`${
              descriptionLength >= maxDescriptionLength
                ? "text-red-600"
                : "text-gray-500"
            }`}
          >
            {descriptionLength}/{maxDescriptionLength}
          </p>
        </div>
      </div>

      {/* Hourly Rate Section */}
      <div className="space-y-2">
        <Label htmlFor="hourlyRate">
          Hourly Rate (PHP){" "}
          <span className="text-sm text-gray-500">(Optional)</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            ₱
          </span>
          <Input
            id="hourlyRate"
            type="number"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="0.00"
            className="pl-8"
            step="0.01"
            min="0"
          />
        </div>
        <p className="text-sm text-gray-500">
          Set your hourly rate to help clients understand your pricing
        </p>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={!hasChanges || isPending}
          className="w-full sm:w-auto"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
        {hasChanges && !isPending && (
          <p className="text-sm text-amber-600">You have unsaved changes</p>
        )}
      </div>
    </form>
  );
}
