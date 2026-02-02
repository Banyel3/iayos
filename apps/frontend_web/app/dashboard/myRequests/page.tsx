"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";
import MobileNav from "@/components/ui/mobile-nav";
import DesktopNavbar from "@/components/ui/desktop-sidebar";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useWorkerAvailability } from "@/lib/hooks/useWorkerAvailability";
import { API_BASE_URL } from "@/lib/api/config";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import { useQueryClient } from "@tanstack/react-query";
import {
  useMyJobs,
  useInProgressJobs,
  useCompletedJobs,
} from "@/lib/hooks/useHomeData";
import { useBarangays } from "@/lib/hooks/useLocations";
import {
  EstimatedTimeCard,
  type EstimatedCompletion,
} from "@/components/ui/estimated-time-card";

// Extended User interface for requests page
interface RequestsUser extends User {
  profile_data?: {
    firstName?: string;
    lastName?: string;
    profileType?: "WORKER" | "CLIENT" | null;
    profileImg?: string;
  };
}

// Job Request interface - extended with more details
interface JobRequest {
  id: string;
  title: string;
  price: string;
  date: string;
  status: "ACTIVE" | "COMPLETED" | "PENDING" | "IN_PROGRESS";
  description?: string;
  location?: string;
  client?: {
    name: string;
    avatar: string;
    rating: number;
    city?: string;
  };
  worker?: {
    name: string;
    avatar: string;
    rating: number;
  };
  assignedWorker?: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    city?: string;
  };
  category?: string;
  postedDate?: string;
  completedDate?: string;
  paymentStatus?: "PENDING" | "DOWNPAYMENT_PAID" | "FULLY_PAID";
  downpaymentMethod?: "WALLET" | "GCASH" | "MAYA" | "CARD" | "BANK_TRANSFER";
  finalPaymentMethod?:
    | "WALLET"
    | "GCASH"
    | "MAYA"
    | "CARD"
    | "BANK_TRANSFER"
    | "CASH";
  downpaymentAmount?: string;
  finalPaymentAmount?: string;
  totalAmount?: string;
  photos?: Array<{
    id: number;
    url: string;
    file_name?: string;
  }>;
  estimatedCompletion?: EstimatedCompletion | null;
}

const MyRequestsPage = () => {
  const { user: authUser, isAuthenticated, isLoading, logout } = useAuth();
  const user = authUser as RequestsUser;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "myRequests" | "inProgress" | "pastRequests" | "requests"
  >("myRequests");
  const [selectedJob, setSelectedJob] = useState<JobRequest | null>(null);
  const [isJobPostModalOpen, setIsJobPostModalOpen] = useState(false);
  const [fullImageView, setFullImageView] = useState<string | null>(null);
  const [materials, setMaterials] = useState<string[]>([]);
  const [materialInput, setMaterialInput] = useState("");

  // Image upload states
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Job post form state
  const [jobPostForm, setJobPostForm] = useState({
    title: "",
    description: "",
    category_id: "",
    budget: "",
    location: "",
    expected_duration: "",
    preferred_start_date: "",
  });
  const [durationNumber, setDurationNumber] = useState("");
  const [durationUnit, setDurationUnit] = useState("hours");
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [jobPostError, setJobPostError] = useState("");

  // Payment method selection
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "WALLET" | "GCASH"
  >("WALLET");
  const [pendingJobData, setPendingJobData] = useState<any>(null);

  // Fetch barangays for Zamboanga City (cityID = 1)
  const {
    data: barangaysData,
    isLoading: barangaysLoading,
    error: barangaysError,
  } = useBarangays(1);
  const barangays = barangaysData || [];

  // Debug barangays
  console.log("[MyRequests] Barangays:", {
    count: barangays.length,
    loading: barangaysLoading,
    error: barangaysError,
    data: barangays.slice(0, 3), // First 3 for debugging
  });

  // Job categories - fetched from backend
  interface JobCategory {
    id: string;
    name: string;
    icon: string;
  }
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);

  // Worker availability hook - must be called before any early returns
  const isWorker = user?.profile_data?.profileType === "WORKER";
  const isClient = user?.profile_data?.profileType === "CLIENT";
  const {
    isAvailable,
    isLoading: isLoadingAvailability,
    handleAvailabilityToggle,
  } = useWorkerAvailability(isWorker, isAuthenticated);

  // React Query hooks with sessionStorage (after isWorker/isClient are defined)
  const { data: jobRequests = [], isLoading: isLoadingRequests } = useMyJobs(
    isAuthenticated && isClient,
  );
  const { data: inProgressJobs = [], isLoading: isLoadingInProgress } =
    useInProgressJobs(isAuthenticated && activeTab === "inProgress");
  const { data: completedJobsData = [], isLoading: isLoadingCompleted } =
    useCompletedJobs(isAuthenticated && activeTab === "pastRequests");

  // Map completed jobs to JobRequest format
  const completedJobs = completedJobsData.map((job) => ({
    id: job.id,
    title: job.title,
    price: job.budget,
    date: job.postedAt,
    status: "COMPLETED" as const,
    description: job.description,
    location: job.location,
    category: job.category,
    postedDate: job.postedAt,
    photos: job.photos,
    client: isWorker
      ? {
          name: job.postedBy.name,
          avatar: job.postedBy.avatar,
          rating: job.postedBy.rating,
        }
      : undefined,
    assignedWorker: !isWorker
      ? {
          id: job.id,
          name: job.postedBy.name,
          avatar: job.postedBy.avatar,
          rating: job.postedBy.rating,
        }
      : undefined,
  }));

  // State for cancel confirmation dialog
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [jobToCancel, setJobToCancel] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // State for job applications
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [processingApplication, setProcessingApplication] = useState<{
    id: number;
    action: "accept" | "reject";
  } | null>(null);

  // State for wallet balance
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);

  // Fetch wallet balance for clients
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!isAuthenticated || !isClient) return;

      try {
        setIsLoadingWallet(true);
        const response = await fetch(
          `${API_BASE_URL}/profiles/wallet/balance`,
          {
            credentials: "include",
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setWalletBalance(parseFloat(data.balance) || 0);
          }
        }
      } catch (error) {
        console.error("Error fetching wallet balance:", error);
      } finally {
        setIsLoadingWallet(false);
      }
    };

    fetchWalletBalance();
  }, [isAuthenticated, isClient]);

  // Fetch job categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/adminpanel/jobs/categories`,
          {
            credentials: "include",
          },
        );
        const data = await response.json();
        if (data.success && data.categories) {
          // Map categories to the format needed for the dropdown
          const mappedCategories = data.categories.map((cat: any) => ({
            id: cat.id.toString(),
            name: cat.name,
            icon: cat.icon || "📋",
          }));
          setJobCategories(mappedCategories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback to default categories if fetch fails
        setJobCategories([
          { id: "1", name: "Plumbing", icon: "🔧" },
          { id: "2", name: "Electrical", icon: "⚡" },
          { id: "3", name: "Carpentry", icon: "🔨" },
          { id: "4", name: "Painting", icon: "🎨" },
          { id: "5", name: "Cleaning", icon: "🧹" },
          { id: "6", name: "Gardening", icon: "🌱" },
          { id: "7", name: "Moving", icon: "📦" },
          { id: "8", name: "Appliance Repair", icon: "🔌" },
        ]);
      }
    };
    fetchCategories();
  }, []);

  // Handle adding materials
  const handleAddMaterial = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && materialInput.trim()) {
      e.preventDefault();
      if (!materials.includes(materialInput.trim())) {
        setMaterials([...materials, materialInput.trim()]);
        setMaterialInput("");
      }
    }
  };

  const handleRemoveMaterial = (material: string) => {
    setMaterials(materials.filter((m) => m !== material));
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);

    // Validate file types and sizes
    const validFiles: File[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

    fileArray.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        alert(
          `${file.name} is not a valid image type. Please use JPEG, PNG, JPG, or WEBP.`,
        );
        return;
      }
      if (file.size > maxSize) {
        alert(`${file.name} is too large. Maximum size is 5MB.`);
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      // Add to existing images
      const newImages = [...selectedImages, ...validFiles];
      setSelectedImages(newImages);

      // Create preview URLs
      const newPreviewUrls = validFiles.map((file) =>
        URL.createObjectURL(file),
      );
      setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
    }
  };

  const handleRemoveImage = (index: number) => {
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviewUrls[index]);

    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviewUrls.filter((_, i) => i !== index);

    setSelectedImages(newImages);
    setImagePreviewUrls(newPreviews);
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Handle job post form submission
  const handleJobPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJobPostError("");

    // Validation
    if (!jobPostForm.title.trim()) {
      setJobPostError("Please enter a job title");
      return;
    }
    if (!jobPostForm.category_id) {
      setJobPostError("Please select a category");
      return;
    }
    if (!jobPostForm.description.trim()) {
      setJobPostError("Please enter a job description");
      return;
    }
    if (!jobPostForm.budget || parseFloat(jobPostForm.budget) <= 0) {
      setJobPostError("Please enter a valid budget");
      return;
    }

    if (!jobPostForm.location.trim()) {
      setJobPostError("Please select a barangay");
      return;
    }

    const budgetAmount = parseFloat(jobPostForm.budget);
    const downpayment = budgetAmount * 0.5;

    // Prepare job data
    const expectedDuration =
      durationNumber && durationUnit
        ? `${durationNumber} ${durationUnit}`
        : null;

    const jobData = {
      title: jobPostForm.title,
      description: jobPostForm.description,
      category_id: parseInt(jobPostForm.category_id),
      budget: budgetAmount,
      location: `${jobPostForm.location}, Zamboanga City`,
      expected_duration: expectedDuration,
      preferred_start_date: jobPostForm.preferred_start_date || null,
      materials_needed: materials,
      downpayment,
    };

    // Store pending job data and show payment method modal
    setPendingJobData(jobData);
    setShowPaymentMethodModal(true);
  };

  // Handle payment method confirmation
  const handlePaymentMethodConfirm = async () => {
    if (!pendingJobData) return;

    const budgetAmount = pendingJobData.budget;
    const downpayment = pendingJobData.downpayment;

    // Check wallet balance if WALLET payment is selected
    if (selectedPaymentMethod === "WALLET" && walletBalance < downpayment) {
      alert(
        `❌ Insufficient Wallet Balance\n\n` +
          `Required: ₱${downpayment.toFixed(2)}\n` +
          `Available: ₱${walletBalance.toFixed(2)}\n\n` +
          `Please deposit more funds or select GCash payment.`,
      );
      return;
    }

    setShowPaymentMethodModal(false);
    setIsSubmittingJob(true);

    try {
      const response = await fetch(`${API_BASE_URL}/jobs/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...pendingJobData,
          payment_method: selectedPaymentMethod,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const jobId = data.job_posting_id;

        // Handle GCASH payment (requires payment gateway)
        if (
          data.payment_method === "GCASH" &&
          data.requires_payment &&
          data.invoice_url
        ) {
          alert(
            `💰 Job Created - Payment Required\n\n` +
              `Job: ${pendingJobData.title}\n` +
              `Escrow Payment (50%): ₱${data.escrow_amount?.toFixed(2)}\n\n` +
              `You will be redirected to complete your payment via GCash.\n` +
              `Your job will be activated once payment is confirmed.`,
          );

          // Open payment page
          window.location.href = data.invoice_url;
          return;
        }

        // Handle WALLET payment (already deducted)
        if (data.payment_method === "WALLET") {
          alert(
            `✅ Job Posted Successfully!\n\n` +
              `Payment Method: Wallet\n` +
              `Escrow Paid: ₱${data.escrow_amount?.toFixed(2)}\n` +
              `Remaining Payment: ₱${data.remaining_payment?.toFixed(2)}\n` +
              `New Wallet Balance: ₱${data.new_wallet_balance?.toFixed(2)}\n\n` +
              `The downpayment has been deducted from your wallet and is now held in escrow.`,
          );

          // Update local wallet balance
          setWalletBalance(data.new_wallet_balance || 0);
        }

        // Upload images if any were selected
        if (selectedImages.length > 0) {
          setUploadingImages(true);

          for (const image of selectedImages) {
            try {
              const formData = new FormData();
              formData.append("image", image);

              const uploadResponse = await fetch(
                `${API_BASE_URL}/jobs/${jobId}/upload-image`,
                {
                  method: "POST",
                  credentials: "include",
                  body: formData,
                },
              );

              if (!uploadResponse.ok) {
                console.error(`Failed to upload image: ${image.name}`);
              }
            } catch (uploadError) {
              console.error(
                `Error uploading image ${image.name}:`,
                uploadError,
              );
            }
          }

          setUploadingImages(false);
        }

        // Reset form and close modal
        setJobPostForm({
          title: "",
          description: "",
          category_id: "",
          budget: "",
          location: "",
          expected_duration: "",
          preferred_start_date: "",
        });
        setMaterials([]);
        setSelectedImages([]);
        setImagePreviewUrls([]);
        setPendingJobData(null);
        setIsJobPostModalOpen(false);

        // Reload page to show new job
        window.location.reload();
      } else {
        setJobPostError(
          data.error || data.message || "Failed to create job posting",
        );
      }
    } catch (error) {
      console.error("Error creating job:", error);
      setJobPostError(
        getErrorMessage(error, "Failed to create job. Please try again."),
      );
    } finally {
      setIsSubmittingJob(false);
    }
  };

  const handleJobPostSubmit_OLD = async (e: React.FormEvent) => {
    e.preventDefault();
    setJobPostError("");

    if (!jobPostForm.title.trim()) {
      setJobPostError("Please enter a job title");
      return;
    }
    if (!jobPostForm.category_id) {
      setJobPostError("Please select a category");
      return;
    }
    if (!jobPostForm.budget || parseFloat(jobPostForm.budget) <= 0) {
      setJobPostError("Please enter a valid budget");
      return;
    }

    if (!jobPostForm.location.trim()) {
      setJobPostError("Please select a barangay");
      return;
    }

    const budgetAmount = parseFloat(jobPostForm.budget);
    const downpayment = budgetAmount * 0.5;

    // Show payment confirmation
    const confirmPayment = confirm(
      `💰 Job Posting Confirmation\n\n` +
        `Job: ${jobPostForm.title}\n` +
        `Total Budget: ₱${budgetAmount.toFixed(2)}\n` +
        `50% Downpayment (Escrow): ₱${downpayment.toFixed(2)}\n\n` +
        `You will be redirected to pay the escrow amount via GCash.\n` +
        `The downpayment will be held in escrow and released to the worker upon job completion.\n\n` +
        `Continue to payment?`,
    );

    if (!confirmPayment) {
      return;
    }

    setIsSubmittingJob(true);

    try {
      // Combine duration number and unit
      const expectedDuration =
        durationNumber && durationUnit
          ? `${durationNumber} ${durationUnit}`
          : null;

      const response = await fetch(`${API_BASE_URL}/jobs/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: jobPostForm.title,
          description: jobPostForm.description,
          category_id: parseInt(jobPostForm.category_id),
          budget: parseFloat(jobPostForm.budget),
          location: `${jobPostForm.location}, Zamboanga City`,
          expected_duration: expectedDuration,
          preferred_start_date: jobPostForm.preferred_start_date || null,
          materials_needed: materials,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const jobId = data.job_posting_id;

        // Check if payment is required (payment invoice generated)
        if (data.requires_payment && data.invoice_url) {
          alert(
            `💰 Job Created - Payment Required\n\n` +
              `Job: ${jobPostForm.title}\n` +
              `Escrow Payment (50%): ₱${data.escrow_amount?.toFixed(2)}\n\n` +
              `You will be redirected to complete your payment via GCash.\n` +
              `Your job will be activated once payment is confirmed.`,
          );

          // Open payment page
          window.location.href = data.invoice_url;
          return;
        }

        // Show success message with escrow details
        alert(
          `✅ Job Posted Successfully!\n\n` +
            `Escrow Paid: ₱${data.escrow_amount?.toFixed(2)}\n` +
            `Remaining Payment: ₱${data.remaining_payment?.toFixed(2)}\n` +
            `New Wallet Balance: ₱${data.new_wallet_balance?.toFixed(2)}\n\n` +
            `The downpayment is now held in escrow and will be released to the worker upon job completion.`,
        );

        // Upload images if any were selected
        if (selectedImages.length > 0) {
          setUploadingImages(true);

          for (const image of selectedImages) {
            try {
              const formData = new FormData();
              formData.append("image", image);

              const uploadResponse = await fetch(
                `${API_BASE_URL}/jobs/${jobId}/upload-image`,
                {
                  method: "POST",
                  credentials: "include",
                  body: formData,
                },
              );

              if (!uploadResponse.ok) {
                console.error(`Failed to upload image: ${image.name}`);
              }
            } catch (uploadError) {
              console.error(
                `Error uploading image ${image.name}:`,
                uploadError,
              );
            }
          }

          setUploadingImages(false);
        }

        // Reset form
        setJobPostForm({
          title: "",
          description: "",
          category_id: "",
          budget: "",
          location: "",
          expected_duration: "",
          preferred_start_date: "",
        });
        setDurationNumber("");
        setDurationUnit("hours");
        setMaterials([]);
        setSelectedImages([]);
        setImagePreviewUrls([]);
        setIsJobPostModalOpen(false);

        // Refresh the page or refetch data
        window.location.reload();
      } else {
        setJobPostError(data.error || "Failed to create job post");
      }
    } catch (error) {
      console.error("Error creating job post:", error);
      setJobPostError(getErrorMessage(error, "Failed to create job post"));
    } finally {
      setIsSubmittingJob(false);
      setUploadingImages(false);
    }
  };

  // Handle job cancellation
  const handleCancelJob = async () => {
    if (!jobToCancel) return;

    setIsCancelling(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/jobs/${jobToCancel}/cancel`,
        {
          method: "PATCH",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(getErrorMessage(errorData, "Failed to cancel job"));
      }

      const data = await response.json();

      if (data.success) {
        // Invalidate the jobs query to refetch the list
        queryClient.invalidateQueries({ queryKey: ["myJobs"] });
        setSelectedJob(null);
        setShowCancelConfirm(false);
        setJobToCancel(null);

        // Show refund message if escrow was refunded
        if (data.refunded && data.refund_amount > 0) {
          alert(
            `✅ Job Cancelled Successfully!\n\n` +
              `Your escrow payment of ₱${data.refund_amount.toFixed(2)} has been refunded to your wallet.`,
          );
        } else {
          alert("Job cancelled successfully!");
        }
      } else {
        throw new Error(data.error || "Failed to cancel job");
      }
    } catch (error) {
      console.error("Error cancelling job:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to cancel job. Please try again.",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelClick = (jobId: number) => {
    setJobToCancel(jobId);
    setShowCancelConfirm(true);
    setSelectedJob(null); // Close the job detail modal
  };

  const handleCancelDialogClose = () => {
    if (!isCancelling) {
      setShowCancelConfirm(false);
      setJobToCancel(null);
    }
  };

  // Handle accepting a job application
  const handleAcceptApplication = async (applicationId: number) => {
    if (!selectedJob) return;

    if (
      !confirm(
        "Are you sure you want to accept this application? This will reject all other pending applications and start the job.",
      )
    ) {
      return;
    }

    setProcessingApplication({ id: applicationId, action: "accept" });
    try {
      const response = await fetch(
        `${API_BASE_URL}/jobs/${selectedJob.id}/applications/${applicationId}/accept`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (data.success) {
        alert(
          "✅ Application accepted! A chat conversation has been created. You can now discuss the job details.",
        );

        // Refresh applications and job data
        window.location.reload();
      } else {
        alert(data.error || "Failed to accept application");
      }
    } catch (error) {
      console.error("Error accepting application:", error);
      alert("Failed to accept application. Please try again.");
    } finally {
      setProcessingApplication(null);
    }
  };

  // Handle rejecting a job application
  const handleRejectApplication = async (applicationId: number) => {
    if (!selectedJob) return;

    if (!confirm("Are you sure you want to reject this application?")) {
      return;
    }

    setProcessingApplication({ id: applicationId, action: "reject" });
    try {
      const response = await fetch(
        `${API_BASE_URL}/jobs/${selectedJob.id}/applications/${applicationId}/reject`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (data.success) {
        // Update local state
        setJobApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, status: "REJECTED" } : app,
          ),
        );
        alert("Application rejected");
      } else {
        alert(data.error || "Failed to reject application");
      }
    } catch (error) {
      console.error("Error rejecting application:", error);
      alert("Failed to reject application. Please try again.");
    } finally {
      setProcessingApplication(null);
    }
  };

  // Fetch applications when a job is selected (for clients)
  useEffect(() => {
    const fetchApplications = async () => {
      if (!selectedJob || !isClient) {
        setJobApplications([]);
        return;
      }

      setIsLoadingApplications(true);
      try {
        console.log("📋 Fetching applications for job:", selectedJob.id);
        const response = await fetch(
          `${API_BASE_URL}/jobs/${selectedJob.id}/applications`,
          {
            credentials: "include",
          },
        );

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Error response:", errorData);
          throw new Error(
            getErrorMessage(errorData, "Failed to fetch applications"),
          );
        }

        const data = await response.json();
        console.log("Applications data:", data);
        if (data.success) {
          setJobApplications(data.applications);
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
        setJobApplications([]);
      } finally {
        setIsLoadingApplications(false);
      }
    };

    fetchApplications();
  }, [selectedJob, isClient]);

  // Authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center pb-16">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Filter requests based on active tab
  const filteredRequests = jobRequests.filter((request) => {
    if (activeTab === "myRequests") {
      return request.status === "ACTIVE";
    } else {
      return request.status === "COMPLETED";
    }
  });

  // Check if user is KYC verified
  const isKycVerified = user?.kycVerified || false;

  // Verification gate for workers (only show if NOT KYC verified)
  if (isWorker && !isKycVerified) {
    return (
      <div className="min-h-screen bg-blue-50">
        {/* Desktop Navbar */}
        <DesktopNavbar
          isWorker={true}
          userName={user?.profile_data?.firstName || "Worker"}
          userAvatar={user?.profile_data?.profileImg || "/worker1.jpg"}
          onLogout={logout}
          isAvailable={isAvailable}
          isLoadingAvailability={isLoadingAvailability}
          onAvailabilityToggle={handleAvailabilityToggle}
        />

        {/* Verification Gate Content */}
        <div className="lg:max-w-4xl lg:mx-auto lg:px-8 lg:py-16 px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 text-center border-2 border-blue-100">
            {/* Icon */}
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Verification Required
            </h1>

            {/* Description */}
            <p className="text-gray-600 text-base lg:text-lg mb-2 max-w-2xl mx-auto leading-relaxed">
              To access job opportunities and start earning, you need to
              complete your identity verification first.
            </p>
            <p className="text-gray-500 text-sm lg:text-base mb-8 max-w-xl mx-auto">
              This helps us ensure a safe and trustworthy platform for both
              workers and clients.
            </p>

            {/* Benefits List */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 max-w-xl mx-auto">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 text-left">
                What you'll get after verification:
              </h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Browse and apply for available jobs
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Receive job invitations from clients
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Build your reputation with verified reviews
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Start earning money through the platform
                  </span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => router.push("/dashboard/kyc")}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-base font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Verify Now
            </button>

            {/* Back Link */}
            <button
              onClick={() => router.push("/dashboard/home")}
              className="mt-4 text-gray-500 hover:text-gray-700 text-sm font-medium block mx-auto transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <MobileNav />
        </div>
      </div>
    );
  }

  // Verification gate for clients (only show if NOT KYC verified)
  if (isClient && !isKycVerified) {
    return (
      <div className="min-h-screen bg-blue-50">
        {/* Desktop Navbar */}
        <DesktopNavbar
          isWorker={false}
          userName={user?.profile_data?.firstName || "Client"}
          userAvatar={user?.profile_data?.profileImg || "/worker2.jpg"}
          onLogout={logout}
          isAvailable={isAvailable}
          isLoadingAvailability={isLoadingAvailability}
          onAvailabilityToggle={handleAvailabilityToggle}
        />

        {/* Verification Gate Content */}
        <div className="lg:max-w-4xl lg:mx-auto lg:px-8 lg:py-16 px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 text-center border-2 border-blue-100">
            {/* Icon */}
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Verification Required
            </h1>

            {/* Description */}
            <p className="text-gray-600 text-base lg:text-lg mb-2 max-w-2xl mx-auto leading-relaxed">
              To post job requests and hire workers, you need to complete your
              identity verification first.
            </p>
            <p className="text-gray-500 text-sm lg:text-base mb-8 max-w-xl mx-auto">
              This helps us ensure a safe and trustworthy platform for both
              workers and clients.
            </p>

            {/* Benefits List */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 max-w-xl mx-auto">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 text-left">
                What you'll get after verification:
              </h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Post job requests and service needs
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Connect with verified skilled workers
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Secure payment transactions
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Track and manage all your service requests
                  </span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => router.push("/dashboard/kyc")}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-base font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Verify Now
            </button>

            {/* Back Link */}
            <button
              onClick={() => router.push("/dashboard/home")}
              className="mt-4 text-gray-500 hover:text-gray-700 text-sm font-medium block mx-auto transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <MobileNav />
        </div>
      </div>
    );
  }

  // Render for users without proper profile type
  if (!isClient && !isWorker) {
    return (
      <div className="min-h-screen bg-blue-50 pb-16 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Profile Setup Required
            </h1>
            <p className="text-gray-600 mb-6">
              Complete your profile setup to access this feature.
            </p>
            <button
              onClick={() => router.push("/dashboard/profile")}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Complete Profile
            </button>
          </div>
        </div>
        <MobileNav />
      </div>
    );
  }

  // Main content for KYC verified users (both workers and clients)
  return (
    <div className="min-h-screen bg-blue-50">
      {/* Notification Bell - Mobile Only */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>

      {/* Desktop Navbar */}
      <DesktopNavbar
        isWorker={isWorker}
        userName={
          user?.profile_data?.firstName || (isWorker ? "Worker" : "Client")
        }
        userAvatar={
          user?.profile_data?.profileImg ||
          (isWorker ? "/worker1.jpg" : "/worker2.jpg")
        }
        onLogout={logout}
        isAvailable={isAvailable}
        isLoadingAvailability={isLoadingAvailability}
        onAvailabilityToggle={handleAvailabilityToggle}
      />

      {/* Desktop & Mobile Content */}
      <div className="lg:max-w-7xl lg:mx-auto lg:px-8 lg:py-8">
        {/* Header - Mobile Only */}
        <div className="lg:hidden bg-white px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">iAyos</h1>
            {isClient && (
              <button
                onClick={() => router.push("/dashboard/jobs/create/listing")}
                className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center space-x-1"
              >
                <span>+</span>
                <span>Post Job</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white lg:bg-transparent px-4 lg:px-0 py-2 lg:py-0 border-b lg:border-0 border-gray-100 lg:mb-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("myRequests")}
              className={`pb-2 text-sm lg:text-base font-medium border-b-2 transition-colors ${
                activeTab === "myRequests"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              My Jobs
            </button>
            <button
              onClick={() => setActiveTab("inProgress")}
              className={`pb-2 text-sm lg:text-base font-medium border-b-2 transition-colors ${
                activeTab === "inProgress"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setActiveTab("pastRequests")}
              className={`pb-2 text-sm lg:text-base font-medium border-b-2 transition-colors ${
                activeTab === "pastRequests"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              {isWorker ? "Past Jobs" : "Past Requests"}
            </button>
            {/* Requests tab - only for clients */}
            {isClient && (
              <button
                onClick={() => setActiveTab("requests")}
                className={`pb-2 text-sm lg:text-base font-medium border-b-2 transition-colors ${
                  activeTab === "requests"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500"
                }`}
              >
                Requests
              </button>
            )}
            {/* Post Job button - desktop only, for clients */}
            {isClient && (
              <div className="hidden lg:block ml-auto">
                <button
                  onClick={() => router.push("/dashboard/jobs/create/listing")}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center space-x-1"
                >
                  <span>+</span>
                  <span>Post a Job</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 lg:px-0 py-4">
          {/* CLIENT VIEW */}
          {isClient && activeTab === "myRequests" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
                  Active Requests
                </h2>
                <button
                  onClick={() => router.push("/dashboard/jobs/create/listing")}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center space-x-1"
                >
                  <span>+</span>
                  <span>Post a Job</span>
                </button>
              </div>

              {/* Active Requests List */}
              <div className="space-y-3">
                {isLoadingRequests ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Loading your requests...</p>
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-gray-900 font-medium mb-2">
                      No active requests
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Create your first job posting to get started
                    </p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => setSelectedJob(request)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {request.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {request.date}
                          </p>
                          {request.location && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              {request.location}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 text-lg">
                            {request.price}
                          </p>
                          <svg
                            className="w-5 h-5 text-gray-400 ml-auto mt-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {/* WORKER VIEW */}
          {isWorker && activeTab === "myRequests" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
                  Active Job Applications
                </h2>
              </div>

              {/* Active Requests List for Workers */}
              <div className="space-y-3">
                {isLoadingRequests ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">
                      Loading your applications...
                    </p>
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-gray-900 font-medium mb-2">
                      No active applications
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Browse available jobs on the home page to get started
                    </p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => setSelectedJob(request)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {request.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {request.date}
                          </p>
                          {request.location && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              {request.location}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 text-lg">
                            {request.price}
                          </p>
                          <svg
                            className="w-5 h-5 text-gray-400 ml-auto mt-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {/* IN PROGRESS JOBS - Both Client and Worker */}
          {activeTab === "inProgress" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
                  {isClient ? "Jobs In Progress" : "My Active Jobs"}
                </h2>
              </div>

              {isLoadingInProgress ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">
                    {isClient
                      ? "Loading jobs in progress..."
                      : "Loading active jobs..."}
                  </p>
                </div>
              ) : inProgressJobs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {isClient
                      ? "No jobs currently in progress"
                      : "You don't have any active jobs"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {inProgressJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 text-base">
                              {job.title}
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              In Progress
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {job.description && job.description.length > 100
                              ? `${job.description.substring(0, 100)}...`
                              : job.description || "No description"}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              {job.location}
                            </span>
                            <span className="flex items-center">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                />
                              </svg>
                              {job.category}
                            </span>
                            {isClient && job.assignedWorker && (
                              <span className="flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                                {job.assignedWorker.name}
                              </span>
                            )}
                            {isWorker && job.client && (
                              <span className="flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                                Client: {job.client.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end gap-2">
                          <p className="text-lg font-bold text-blue-600">
                            {job.price}
                          </p>
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* CLIENT PAST REQUESTS */}
          {isClient && activeTab === "pastRequests" && (
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
                Past Requests
              </h2>

              {/* Past Requests List */}
              <div className="space-y-3">
                {isLoadingRequests ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Loading past requests...</p>
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-gray-900 font-medium mb-2">
                      No past requests
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Your completed jobs will appear here
                    </p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => setSelectedJob(request)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {request.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {request.date}
                          </p>
                          <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Completed
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 text-lg">
                            {request.price}
                          </p>
                          <svg
                            className="w-5 h-5 text-gray-400 ml-auto mt-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {/* CLIENT REQUESTS TAB - Worker Applications */}
          {isClient && activeTab === "requests" && (
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
                Worker Applications
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                View workers who have applied to your posted jobs
              </p>

              {/* Applications List */}
              <div className="space-y-3">
                {isLoadingRequests ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Loading applications...</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-gray-900 font-medium mb-2">
                      No applications yet
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Worker applications to your jobs will appear here
                    </p>
                    <button
                      onClick={() => router.push("/dashboard/home")}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      Browse Workers
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}{" "}
          {/* WORKER PAST REQUESTS */}
          {isWorker && activeTab === "pastRequests" && (
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
                Past Jobs
              </h2>

              {/* Past Jobs List */}
              <div className="space-y-3">
                {isLoadingCompleted ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Loading completed jobs...</p>
                  </div>
                ) : completedJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-gray-900 font-medium mb-2">
                      No completed jobs yet
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Your completed jobs will appear here
                    </p>
                  </div>
                ) : (
                  completedJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            {/* Client Avatar */}
                            {job.client && (
                              <div className="flex-shrink-0">
                                <Image
                                  src={job.client.avatar}
                                  alt={job.client.name}
                                  width={40}
                                  height={40}
                                  className="rounded-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 mb-1 truncate">
                                {job.title}
                              </h3>
                              {job.client && (
                                <p className="text-sm text-gray-600 mb-1">
                                  Client: {job.client.name}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mb-2">
                                {job.date}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                  ✓ Completed
                                </span>
                                {job.category && (
                                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    {job.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-gray-900 text-lg whitespace-nowrap">
                            {job.price}
                          </p>
                          <svg
                            className="w-5 h-5 text-gray-400 ml-auto mt-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Job Details Modal */}
      {selectedJob && !fullImageView && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="bg-white w-full lg:w-full lg:max-w-2xl lg:rounded-lg rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Job Details
              </h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Title and Price */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedJob.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-blue-600">
                    {selectedJob.price}
                  </span>
                  {selectedJob.status === "COMPLETED" && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                      Completed
                    </span>
                  )}
                  {selectedJob.status === "ACTIVE" && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                      Active
                    </span>
                  )}
                  {selectedJob.status === "IN_PROGRESS" && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">
                      In Progress
                    </span>
                  )}
                </div>
              </div>

              {/* Category and Location */}
              <div className="grid grid-cols-2 gap-4">
                {selectedJob.category && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Category</p>
                    <p className="font-medium text-gray-900">
                      {selectedJob.category}
                    </p>
                  </div>
                )}
                {selectedJob.location && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <p className="font-medium text-gray-900 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {selectedJob.location}
                    </p>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                {selectedJob.postedDate && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Posted Date</p>
                    <p className="font-medium text-gray-900">
                      {selectedJob.postedDate}
                    </p>
                  </div>
                )}
                {selectedJob.completedDate && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Completed Date</p>
                    <p className="font-medium text-gray-900">
                      {selectedJob.completedDate}
                    </p>
                  </div>
                )}
              </div>

              {/* ML Estimated Completion Time */}
              {selectedJob.estimatedCompletion &&
                selectedJob.status !== "COMPLETED" && (
                  <EstimatedTimeCard
                    prediction={selectedJob.estimatedCompletion}
                    countdownMode={selectedJob.status === "IN_PROGRESS"}
                  />
                )}

              {/* Payment Information */}
              {(selectedJob.paymentStatus ||
                selectedJob.downpaymentMethod ||
                selectedJob.finalPaymentMethod) && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    Payment Information
                  </h4>

                  <div className="space-y-3">
                    {/* Payment Status */}
                    {selectedJob.paymentStatus && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            selectedJob.paymentStatus === "FULLY_PAID"
                              ? "bg-green-100 text-green-700"
                              : selectedJob.paymentStatus === "DOWNPAYMENT_PAID"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {selectedJob.paymentStatus === "FULLY_PAID"
                            ? "Fully Paid"
                            : selectedJob.paymentStatus === "DOWNPAYMENT_PAID"
                              ? "Downpayment Paid"
                              : "Pending"}
                        </span>
                      </div>
                    )}

                    {/* Total Amount */}
                    {selectedJob.totalAmount && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Total Amount:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {selectedJob.totalAmount}
                        </span>
                      </div>
                    )}

                    {/* Downpayment Info */}
                    {selectedJob.downpaymentAmount && (
                      <div className="flex items-center justify-between border-t border-blue-200 pt-2">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600">
                            Downpayment (50%):
                          </span>
                          {selectedJob.downpaymentMethod && (
                            <span className="text-xs text-gray-500 flex items-center mt-1">
                              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                              Paid via{" "}
                              {selectedJob.downpaymentMethod === "GCASH"
                                ? "GCash"
                                : selectedJob.downpaymentMethod === "MAYA"
                                  ? "Maya"
                                  : selectedJob.downpaymentMethod === "CARD"
                                    ? "Card"
                                    : selectedJob.downpaymentMethod ===
                                        "BANK_TRANSFER"
                                      ? "Bank Transfer"
                                      : "Wallet"}
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">
                          {selectedJob.downpaymentAmount}
                        </span>
                      </div>
                    )}

                    {/* Final Payment Info */}
                    {selectedJob.finalPaymentAmount && (
                      <div className="flex items-center justify-between border-t border-blue-200 pt-2">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600">
                            Final Payment (50%):
                          </span>
                          {selectedJob.finalPaymentMethod && (
                            <span className="text-xs text-gray-500 flex items-center mt-1">
                              <span
                                className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                  selectedJob.finalPaymentMethod === "CASH"
                                    ? "bg-green-500"
                                    : "bg-blue-500"
                                }`}
                              ></span>
                              Paid via{" "}
                              {selectedJob.finalPaymentMethod === "CASH"
                                ? "Cash"
                                : selectedJob.finalPaymentMethod === "GCASH"
                                  ? "GCash"
                                  : selectedJob.finalPaymentMethod === "MAYA"
                                    ? "Maya"
                                    : selectedJob.finalPaymentMethod === "CARD"
                                      ? "Card"
                                      : selectedJob.finalPaymentMethod ===
                                          "BANK_TRANSFER"
                                        ? "Bank Transfer"
                                        : "Wallet"}
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">
                          {selectedJob.finalPaymentAmount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedJob.description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedJob.description}
                  </p>
                </div>
              )}

              {/* Job Photos */}
              {selectedJob.photos && selectedJob.photos.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Job Photos ({selectedJob.photos.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedJob.photos.map((photo) => {
                      console.log("🖼️ Rendering photo:", photo);
                      return (
                        <div
                          key={photo.id}
                          className="relative h-48 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setFullImageView(photo.url)}
                        >
                          <img
                            src={photo.url}
                            alt={photo.file_name || "Job photo"}
                            className="w-full h-full object-contain bg-gray-100"
                            onLoad={(e) => {
                              console.log("✅ Image loaded:", photo.url);
                              e.currentTarget.style.opacity = "1";
                            }}
                            onError={(e) => {
                              console.error(
                                "❌ Image failed to load:",
                                photo.url,
                              );
                              e.currentTarget.src = "/placeholder-image.png";
                            }}
                            style={{ opacity: 0, transition: "opacity 0.3s" }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  No photos uploaded for this job
                </div>
              )}

              {/* Client Info */}
              {selectedJob.client && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    {isClient ? "Your Information" : "Client Information"}
                  </h4>
                  <div className="flex items-center space-x-3">
                    <Image
                      src={
                        isClient && user?.profile_data?.firstName
                          ? selectedJob.client.avatar
                          : selectedJob.client.avatar
                      }
                      alt={
                        isClient && user?.profile_data?.firstName
                          ? `${user.profile_data.firstName} ${user.profile_data.lastName || ""}`
                          : selectedJob.client.name
                      }
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {isClient && user?.profile_data?.firstName
                          ? `${user.profile_data.firstName} ${user.profile_data.lastName || ""}`
                          : selectedJob.client.name}
                      </p>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg
                          className="w-4 h-4 text-yellow-500 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {selectedJob.client.rating} rating
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Worker Info (for completed jobs) */}
              {selectedJob.worker && selectedJob.status === "COMPLETED" && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    {isWorker ? "Your Information" : "Worker Information"}
                  </h4>
                  <div className="flex items-center space-x-3">
                    <Image
                      src={
                        isWorker && user?.profile_data?.firstName
                          ? selectedJob.worker.avatar
                          : selectedJob.worker.avatar
                      }
                      alt={
                        isWorker && user?.profile_data?.firstName
                          ? `${user.profile_data.firstName} ${user.profile_data.lastName || ""}`
                          : selectedJob.worker.name
                      }
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {isWorker && user?.profile_data?.firstName
                          ? `${user.profile_data.firstName} ${user.profile_data.lastName || ""}`
                          : selectedJob.worker.name}
                      </p>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg
                          className="w-4 h-4 text-yellow-500 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {selectedJob.worker.rating} rating
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Job Applications Section (for clients) - only for ACTIVE jobs */}
              {isClient && selectedJob.status === "ACTIVE" && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Applications ({jobApplications.length})
                  </h4>

                  {isLoadingApplications ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : jobApplications.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <svg
                        className="w-12 h-12 text-gray-400 mx-auto mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <p className="text-gray-600 text-sm">
                        No applications yet
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Workers will be able to apply for this job
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {jobApplications.map((application) => (
                        <div
                          key={application.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                        >
                          {/* Worker Info */}
                          <div className="flex items-start gap-3 mb-3">
                            <Image
                              src={application.worker.avatar}
                              alt={application.worker.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h5 className="font-semibold text-gray-900">
                                  {application.worker.name}
                                </h5>
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    application.status === "PENDING"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : application.status === "ACCEPTED"
                                        ? "bg-green-100 text-green-700"
                                        : application.status === "REJECTED"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {application.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                                <div className="flex items-center">
                                  <svg
                                    className="w-4 h-4 text-yellow-500 mr-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  {application.worker.rating}
                                </div>
                                {application.worker.city && (
                                  <div className="flex items-center">
                                    <svg
                                      className="w-4 h-4 mr-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                    </svg>
                                    {application.worker.city}
                                  </div>
                                )}
                                {application.worker.specialization && (
                                  <span className="text-blue-600">
                                    {application.worker.specialization}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Proposal Details */}
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <p className="text-sm text-gray-700 mb-2">
                              {application.proposal_message}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Budget: </span>
                                <span className="font-semibold text-gray-900">
                                  ₱
                                  {application.proposed_budget.toLocaleString()}
                                </span>
                                {application.budget_option === "ACCEPT" && (
                                  <span className="ml-1 text-xs text-green-600">
                                    (Accepts your budget)
                                  </span>
                                )}
                              </div>
                              {application.estimated_duration && (
                                <div>
                                  <span className="text-gray-600">
                                    Worker Estimate:{" "}
                                  </span>
                                  <span className="font-medium text-gray-900">
                                    {application.estimated_duration}
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* Platform vs Worker Estimate Comparison */}
                            {selectedJob?.estimatedCompletion && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <svg
                                    className="w-4 h-4 text-blue-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                  </svg>
                                  <span className="text-xs font-medium text-gray-600">
                                    Estimate Comparison
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                                    <p className="text-xs text-blue-600 mb-0.5">
                                      Platform AI
                                    </p>
                                    <p className="font-semibold text-blue-900">
                                      {
                                        selectedJob.estimatedCompletion
                                          .formatted_duration
                                      }
                                    </p>
                                    <p
                                      className={`text-xs mt-0.5 ${
                                        selectedJob.estimatedCompletion
                                          .confidence_level >= 0.7
                                          ? "text-green-600"
                                          : selectedJob.estimatedCompletion
                                                .confidence_level >= 0.4
                                            ? "text-yellow-600"
                                            : "text-red-500"
                                      }`}
                                    >
                                      {selectedJob.estimatedCompletion
                                        .confidence_level >= 0.7
                                        ? "high"
                                        : selectedJob.estimatedCompletion
                                              .confidence_level >= 0.4
                                          ? "medium"
                                          : "low"}{" "}
                                      confidence
                                    </p>
                                  </div>
                                  {application.estimated_duration && (
                                    <div className="bg-gray-100 rounded-lg p-2 text-center">
                                      <p className="text-xs text-gray-600 mb-0.5">
                                        Worker
                                      </p>
                                      <p className="font-semibold text-gray-900">
                                        {application.estimated_duration}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {application.status === "PENDING" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleAcceptApplication(application.id)
                                }
                                disabled={
                                  processingApplication?.id ===
                                  Number(application.id)
                                }
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
                              >
                                {processingApplication?.id ===
                                  Number(application.id) &&
                                processingApplication?.action === "accept" ? (
                                  <>
                                    <svg
                                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      ></circle>
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      ></path>
                                    </svg>
                                    Accepting...
                                  </>
                                ) : (
                                  "Accept"
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  handleRejectApplication(application.id)
                                }
                                disabled={
                                  processingApplication?.id ===
                                  Number(application.id)
                                }
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center"
                              >
                                {processingApplication?.id ===
                                  Number(application.id) &&
                                processingApplication?.action === "reject" ? (
                                  <>
                                    <svg
                                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      ></circle>
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      ></path>
                                    </svg>
                                    Rejecting...
                                  </>
                                ) : (
                                  "Reject"
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Worker Assigned Section (for IN_PROGRESS jobs) */}
              {isClient &&
                selectedJob.status === "IN_PROGRESS" &&
                selectedJob.assignedWorker && (
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Worker Assigned
                    </h4>

                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      {/* Worker Info */}
                      <div className="flex items-start gap-3">
                        <Image
                          src={selectedJob.assignedWorker.avatar}
                          alt={selectedJob.assignedWorker.name}
                          width={56}
                          height={56}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-gray-900 text-lg">
                              {selectedJob.assignedWorker.name}
                            </h5>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Assigned
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-700">
                            <div className="flex items-center">
                              <svg
                                className="w-4 h-4 text-yellow-500 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="font-medium">
                                {selectedJob.assignedWorker.rating}
                              </span>
                            </div>
                            {selectedJob.assignedWorker.city && (
                              <div className="flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                {selectedJob.assignedWorker.city}
                              </div>
                            )}
                          </div>

                          {/* View Profile and Message Buttons */}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() =>
                                router.push(
                                  `/worker/${selectedJob.assignedWorker?.id}`,
                                )
                              }
                              className="flex-1 bg-white border border-blue-600 text-blue-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors flex items-center justify-center"
                            >
                              <svg
                                className="w-4 h-4 mr-1.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              View Profile
                            </button>
                            <button
                              onClick={() => router.push("/dashboard/inbox")}
                              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                            >
                              <svg
                                className="w-4 h-4 mr-1.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                              </svg>
                              Message
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Client Information Section (for workers viewing IN_PROGRESS jobs) */}
              {isWorker &&
                selectedJob.status === "IN_PROGRESS" &&
                selectedJob.client && (
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Client Information
                    </h4>

                    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                      {/* Client Info */}
                      <div className="flex items-start gap-3">
                        <Image
                          src={selectedJob.client.avatar}
                          alt={selectedJob.client.name}
                          width={56}
                          height={56}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-gray-900 text-lg">
                              {selectedJob.client.name}
                            </h5>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Client
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-700">
                            <div className="flex items-center">
                              <svg
                                className="w-4 h-4 text-yellow-500 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="font-medium">
                                {selectedJob.client.rating}
                              </span>
                            </div>
                            {selectedJob.client.city && (
                              <div className="flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                {selectedJob.client.city}
                              </div>
                            )}
                          </div>

                          {/* Message Button */}
                          <div className="mt-3">
                            <button
                              onClick={() => router.push("/dashboard/inbox")}
                              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                            >
                              <svg
                                className="w-4 h-4 mr-1.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                              </svg>
                              Message Client
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {selectedJob.status === "ACTIVE" && (
                  <>
                    {isClient && (
                      <button
                        onClick={() =>
                          handleCancelClick(parseInt(selectedJob.id))
                        }
                        className="flex-1 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
                      >
                        Cancel Job
                      </button>
                    )}
                    {isWorker && (
                      <button className="flex-1 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors">
                        Withdraw Application
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => setSelectedJob(null)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNav />
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          {/* Semi-transparent backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={handleCancelDialogClose}
          />

          {/* Dialog Content */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
            <div className="p-6">
              {/* Icon */}
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              {/* Title and Message */}
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Cancel Job Posting?
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to cancel this job posting? This action
                cannot be undone.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelDialogClose}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Keep Job
                </button>
                <button
                  onClick={handleCancelJob}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCancelling ? "Cancelling..." : "Cancel Job"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Post Modal */}
      {isJobPostModalOpen && (
        <div className="fixed inset-0 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
          {/* Semi-transparent backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm"
            onClick={() => setIsJobPostModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mb-8 border border-gray-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                Post a Job
              </h2>
              <button
                onClick={() => setIsJobPostModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {jobPostError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{jobPostError}</p>
                </div>
              )}
              <form className="space-y-6" onSubmit={handleJobPostSubmit}>
                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={jobPostForm.title}
                    onChange={(e) =>
                      setJobPostForm({ ...jobPostForm, title: e.target.value })
                    }
                    placeholder="e.g., Fix Leaking Kitchen Sink"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={jobPostForm.category_id}
                    onChange={(e) =>
                      setJobPostForm({
                        ...jobPostForm,
                        category_id: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {jobCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={jobPostForm.description}
                    onChange={(e) =>
                      setJobPostForm({
                        ...jobPostForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe the job in detail..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Include specific details, requirements, and expectations
                  </p>
                </div>

                {/* Budget Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Budget (₱) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={jobPostForm.budget}
                    onChange={(e) =>
                      setJobPostForm({ ...jobPostForm, budget: e.target.value })
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      jobPostForm.budget &&
                      parseFloat(jobPostForm.budget) > walletBalance
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    required
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      Available balance:
                      <span
                        className={`ml-1 font-semibold ${
                          jobPostForm.budget &&
                          parseFloat(jobPostForm.budget) > walletBalance
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        ₱{walletBalance.toFixed(2)}
                      </span>
                    </p>
                    {jobPostForm.budget &&
                      parseFloat(jobPostForm.budget) > walletBalance && (
                        <p className="text-xs text-red-600 font-medium">
                          Insufficient balance
                        </p>
                      )}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Location <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* City - Read-only (not disabled, so it will be included in form data) */}
                    <div>
                      <input
                        type="text"
                        value="Zamboanga City"
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                        tabIndex={-1}
                      />
                      <p className="text-xs text-gray-500 mt-1">City</p>
                    </div>

                    {/* Barangay - Dropdown */}
                    <div>
                      <select
                        value={jobPostForm.location}
                        onChange={(e) =>
                          setJobPostForm({
                            ...jobPostForm,
                            location: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        required
                        disabled={barangaysLoading}
                      >
                        <option value="">
                          {barangaysLoading
                            ? "Loading barangays..."
                            : barangaysError
                              ? "Error loading barangays"
                              : barangays.length === 0
                                ? "No barangays available"
                                : "Select Barangay"}
                        </option>
                        {barangays.map((barangay) => (
                          <option
                            key={barangay.barangayID}
                            value={barangay.name}
                          >
                            {barangay.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {barangaysError
                          ? "Failed to load barangays. Please refresh."
                          : `Barangay ${barangaysLoading ? "(loading...)" : `(${barangays.length} available)`}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Duration & Start Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Duration
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={durationNumber}
                        onChange={(e) => setDurationNumber(e.target.value)}
                        placeholder="e.g., 2"
                        className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={durationUnit}
                        onChange={(e) => setDurationUnit(e.target.value)}
                        className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Start Date
                    </label>
                    <input
                      type="date"
                      value={jobPostForm.preferred_start_date}
                      onChange={(e) =>
                        setJobPostForm({
                          ...jobPostForm,
                          preferred_start_date: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Materials Needed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Materials Needed (Optional)
                  </label>
                  <input
                    type="text"
                    value={materialInput}
                    onChange={(e) => setMaterialInput(e.target.value)}
                    onKeyDown={handleAddMaterial}
                    placeholder="Type material and press Enter..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Press Enter to add each material
                  </p>
                  {/* Materials Tags */}
                  {materials.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {materials.map((material, index) => (
                        <div
                          key={index}
                          className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-sm flex items-center space-x-2 border border-blue-200"
                        >
                          <span>{material}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterial(material)}
                            className="text-blue-500 hover:text-blue-700 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Photos Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photos (Optional)
                  </label>
                  <input
                    type="file"
                    id="job-images"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="job-images"
                    className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  >
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm text-gray-600 mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, WEBP up to 5MB each
                    </p>
                  </label>

                  {/* Image Previews */}
                  {imagePreviewUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsJobPostModalOpen(false);
                      setJobPostError("");
                      setSelectedImages([]);
                      setImagePreviewUrls([]);
                    }}
                    disabled={isSubmittingJob || uploadingImages}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingJob || uploadingImages}
                    className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isSubmittingJob || uploadingImages ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        {uploadingImages ? "Uploading images..." : "Posting..."}
                      </>
                    ) : (
                      "Post Job"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Selection Modal */}
      {showPaymentMethodModal && pendingJobData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-semibold text-gray-900">
                💰 Select Payment Method
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose how to pay the 50% escrow downpayment
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Payment Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Job:</span>
                  <span className="font-medium text-gray-900">
                    {pendingJobData.title}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Budget:</span>
                  <span className="font-medium text-gray-900">
                    ₱{pendingJobData.budget.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold text-blue-600 pt-2 border-t border-gray-200">
                  <span>50% Downpayment (Escrow):</span>
                  <span>₱{pendingJobData.downpayment.toFixed(2)}</span>
                </div>
              </div>

              {/* Wallet Balance Info */}
              <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-blue-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">
                    Your Wallet Balance:
                  </span>
                </div>
                <span className="font-semibold text-gray-900">
                  ₱{walletBalance.toFixed(2)}
                </span>
              </div>

              {/* Payment Method Options */}
              <div className="space-y-3">
                {/* Wallet Payment */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod("WALLET")}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    selectedPaymentMethod === "WALLET"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start">
                    <div
                      className={`w-5 h-5 rounded-full border-2 mt-0.5 mr-3 flex items-center justify-center ${
                        selectedPaymentMethod === "WALLET"
                          ? "border-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedPaymentMethod === "WALLET" && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900">
                          Pay from Wallet
                        </span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Instant
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Deduct ₱{pendingJobData.downpayment.toFixed(2)} from
                        your wallet balance
                      </p>
                      {walletBalance < pendingJobData.downpayment && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          ⚠️ Insufficient balance (need ₱
                          {(pendingJobData.downpayment - walletBalance).toFixed(
                            2,
                          )}{" "}
                          more)
                        </p>
                      )}
                    </div>
                  </div>
                </button>

                {/* GCash Payment */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod("GCASH")}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    selectedPaymentMethod === "GCASH"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start">
                    <div
                      className={`w-5 h-5 rounded-full border-2 mt-0.5 mr-3 flex items-center justify-center ${
                        selectedPaymentMethod === "GCASH"
                          ? "border-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedPaymentMethod === "GCASH" && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900">
                          Pay with GCash
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          Online Payment
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Pay ₱{pendingJobData.downpayment.toFixed(2)} via GCash
                        online payment
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentMethodModal(false);
                    setPendingJobData(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePaymentMethodConfirm}
                  disabled={
                    selectedPaymentMethod === "WALLET" &&
                    walletBalance < pendingJobData.downpayment
                  }
                  className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Viewer Modal */}
      {fullImageView && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <button
                onClick={() => setFullImageView(null)}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Details
              </button>
              <button
                onClick={() => setFullImageView(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Image Content */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50 flex items-center justify-center">
              <img
                src={fullImageView}
                alt="Full size view"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRequestsPage;
