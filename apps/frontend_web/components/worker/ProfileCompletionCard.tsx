"use client";

import { useProfileCompletion } from "@/lib/hooks/useWorkerProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import {
  Loader2,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function ProfileCompletionCard() {
  const { data, isLoading, error } = useProfileCompletion();
  const [isExpanded, setIsExpanded] = useState(true);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-destructive">
            Failed to load profile completion
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const {
    completion_percentage,
    missing_fields,
    recommendations,
    completed_fields,
  } = data;
  const isComplete = completion_percentage === 100;

  // Calculate progress color
  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-500";
    if (percentage >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getProgressBg = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Map field names to readable labels
  const fieldLabels: Record<string, { label: string; link: string }> = {
    bio: { label: "Add a bio", link: "/dashboard/profile/edit" },
    description: {
      label: "Write profile description",
      link: "/dashboard/profile/edit",
    },
    hourly_rate: { label: "Set hourly rate", link: "/dashboard/profile/edit" },
    profile_image: {
      label: "Upload profile photo",
      link: "/dashboard/profile/edit",
    },
    specializations: {
      label: "Add specializations",
      link: "/dashboard/profile/edit",
    },
    certifications: {
      label: "Upload certifications",
      link: "/dashboard/profile/certifications",
    },
    portfolio: {
      label: "Add portfolio images",
      link: "/dashboard/profile/portfolio",
    },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Profile Completion</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Circular Progress */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative h-24 w-24">
            {/* Background circle */}
            <svg className="h-24 w-24 -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              {/* Progress circle */}
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${
                  2 * Math.PI * 40 * (1 - completion_percentage / 100)
                }`}
                className={`${getProgressBg(completion_percentage)} transition-all duration-500`}
                strokeLinecap="round"
              />
            </svg>
            {/* Percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={`text-2xl font-bold ${getProgressColor(completion_percentage)}`}
              >
                {completion_percentage}%
              </span>
            </div>
          </div>

          <div className="flex-1">
            <h3 className="font-semibold mb-1">
              {isComplete ? "Profile Complete!" : "Almost there!"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isComplete
                ? "Your profile is fully complete and visible to clients."
                : `Complete ${missing_fields.length} more ${
                    missing_fields.length === 1 ? "field" : "fields"
                  } to reach 100%`}
            </p>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Completed Fields */}
            {completed_fields.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-green-600">
                  Completed ({completed_fields.length})
                </h4>
                <div className="space-y-1">
                  {completed_fields.map((field) => (
                    <div
                      key={field}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="capitalize">
                        {field.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Fields */}
            {missing_fields.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-orange-600">
                  Todo ({missing_fields.length})
                </h4>
                <div className="space-y-2">
                  {missing_fields.map((field) => {
                    const fieldInfo = fieldLabels[field] || {
                      label: field.replace("_", " "),
                      link: "/dashboard/profile/edit",
                    };
                    return (
                      <div
                        key={field}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Circle className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{fieldInfo.label}</span>
                        </div>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                        >
                          <Link href={fieldInfo.link}>Add</Link>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="pt-3 border-t">
                <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
