"use client";

import { API_BASE } from "@/lib/api/config";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Key,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Sidebar, useMainContentClass } from "../../components";

interface Admin {
  id: string;
  email: string;
  role: "super_admin" | "admin" | "moderator";
  permissions: string[];
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

interface AdminsResponse {
  success: boolean;
  admins: Admin[];
  current_admin_id: string;
}

const ROLES = {
  super_admin: { label: "Super Admin", color: "red", permissions: "all" },
  admin: { label: "Admin", color: "blue", permissions: "most" },
  moderator: { label: "Moderator", color: "green", permissions: "limited" },
};

const ALL_PERMISSIONS = [
  {
    id: "manage_users",
    label: "Manage Users",
    description: "Create, edit, suspend users",
  },
  {
    id: "approve_kyc",
    label: "Approve KYC",
    description: "Review and approve KYC submissions",
  },
  {
    id: "manage_jobs",
    label: "Manage Jobs",
    description: "Edit, cancel, monitor job listings",
  },
  {
    id: "handle_payments",
    label: "Handle Payments",
    description: "Process refunds, disputes",
  },
  {
    id: "view_reports",
    label: "View Reports",
    description: "Access analytics and reports",
  },
  {
    id: "manage_settings",
    label: "Manage Settings",
    description: "Configure platform settings",
  },
  {
    id: "manage_admins",
    label: "Manage Admins",
    description: "Create and manage admin accounts",
  },
];

export default function AdminManagementPage() {
  const mainClass = useMainContentClass("p-8 min-h-screen");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState<string>("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);
  const [reassignAdminId, setReassignAdminId] = useState("");
  const [showPermissionsMatrix, setShowPermissionsMatrix] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin" as "super_admin" | "admin" | "moderator",
    permissions: [] as string[],
    send_welcome_email: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    // Calculate password strength
    if (formData.password) {
      let strength = 0;
      if (formData.password.length >= 8) strength += 25;
      if (/[a-z]/.test(formData.password)) strength += 25;
      if (/[A-Z]/.test(formData.password)) strength += 25;
      if (/[0-9]/.test(formData.password)) strength += 25;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/settings/admins`,
        {
          credentials: "include",
        },
      );
      const data: AdminsResponse = await response.json();

      if (data.success) {
        setAdmins(data.admins);
        setCurrentAdminId(data.current_admin_id);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    // Password validation (only for add mode)
    if (modalMode === "add") {
      if (!formData.password) {
        errors.password = "Password is required";
      } else if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAdmin = () => {
    setModalMode("add");
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      role: "admin",
      permissions: [],
      send_welcome_email: true,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEditAdmin = (admin: Admin) => {
    // Cannot edit own account
    if (admin.id === currentAdminId) {
      alert("You cannot edit your own account");
      return;
    }

    setModalMode("edit");
    setSelectedAdmin(admin);
    setFormData({
      email: admin.email,
      password: "",
      confirmPassword: "",
      role: admin.role,
      permissions: admin.permissions,
      send_welcome_email: false,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSaveAdmin = async () => {
    if (!validateForm()) return;

    try {
      const url =
        modalMode === "add"
          ? `${API_BASE}/api/adminpanel/settings/admins`
          : `${API_BASE}/api/adminpanel/settings/admins/${selectedAdmin?.id}/permissions`;

      const method = modalMode === "add" ? "POST" : "PUT";

      const body =
        modalMode === "add"
          ? {
            email: formData.email,
            password: formData.password,
            role: formData.role,
            permissions: formData.permissions,
            send_welcome_email: formData.send_welcome_email,
          }
          : {
            permissions: formData.permissions,
            role: formData.role,
          };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          modalMode === "add"
            ? "Admin created successfully!"
            : "Admin updated successfully!",
        );
        setShowModal(false);
        fetchAdmins();
      } else {
        alert(data.error || "Failed to save admin");
      }
    } catch (error) {
      console.error("Error saving admin:", error);
      alert("Failed to save admin");
    }
  };

  const handleToggleStatus = async (admin: Admin) => {
    // Cannot disable own account
    if (admin.id === currentAdminId) {
      alert("You cannot disable your own account");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/adminpanel/settings/admins/${admin.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ is_active: !admin.is_active }),
        },
      );

      const data = await response.json();

      if (data.success) {
        fetchAdmins();
      }
    } catch (error) {
      console.error("Error toggling admin status:", error);
    }
  };

  const handleDeleteClick = (admin: Admin) => {
    // Cannot delete own account
    if (admin.id === currentAdminId) {
      alert("You cannot delete your own account");
      return;
    }

    setAdminToDelete(admin);
    setReassignAdminId("");
    setShowDeleteModal(true);
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;

    try {
      const url = `${API_BASE}/api/adminpanel/settings/admins/${adminToDelete.id}`;
      const params = reassignAdminId ? `?reassign_to=${reassignAdminId}` : "";

      const response = await fetch(url + params, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        alert("Admin deleted successfully!");
        setShowDeleteModal(false);
        fetchAdmins();
      } else {
        alert(data.error || "Failed to delete admin");
      }
    } catch (error) {
      console.error("Error deleting admin:", error);
      alert("Failed to delete admin");
    }
  };

  const handleTogglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      super_admin: "bg-red-100 text-red-700 border-red-200",
      admin: "bg-blue-100 text-blue-700 border-blue-200",
      moderator: "bg-green-100 text-green-700 border-green-200",
    };
    return (
      colors[role as keyof typeof colors] ||
      "bg-gray-100 text-gray-700 border-gray-200"
    );
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength >= 75) return "bg-green-600";
    if (passwordStrength >= 50) return "bg-yellow-600";
    return "bg-red-600";
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength >= 75) return "Strong";
    if (passwordStrength >= 50) return "Medium";
    if (passwordStrength > 0) return "Weak";
    return "";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className={mainClass}>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                <Shield className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">
                Loading admin users...
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Fetching administrator accounts
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className={mainClass}>
        {/* Header */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 p-8 shadow-xl">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-red-500 opacity-20 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-pink-500 opacity-20 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-sm">
                <Shield className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">
                  Access Control
                </span>
              </div>
              <h1 className="mb-2 text-4xl font-bold text-white">
                Admin User Management
              </h1>
              <p className="text-lg text-red-100">
                Manage administrator accounts, roles, and permissions
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowPermissionsMatrix(true)}
                variant="secondary"
                className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Users className="h-4 w-4" />
                Permissions Matrix
              </Button>
              <Button
                onClick={handleAddAdmin}
                className="gap-2 bg-white text-red-600 hover:bg-red-50"
              >
                <Plus className="h-4 w-4" />
                Add New Admin
              </Button>
            </div>
          </div>
        </div>

        {/* Admins Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-white">
            <CardTitle>Administrator Accounts ({admins.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {admins.map((admin) => {
                    const isCurrentUser = admin.id === currentAdminId;
                    return (
                      <tr
                        key={admin.id}
                        className={`hover:bg-gray-50 transition-colors ${isCurrentUser ? "bg-blue-50" : ""
                          }`}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {admin.email}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-blue-600 font-semibold">
                                  (You)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Joined{" "}
                              {new Date(admin.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                              admin.role,
                            )}`}
                          >
                            {ROLES[admin.role].label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            <Key className="h-3 w-3" />
                            {admin.permissions.length}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {admin.last_login ? (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              {new Date(admin.last_login).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">
                              Never
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(admin)}
                            disabled={isCurrentUser}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${admin.is_active ? "bg-green-600" : "bg-gray-300"
                              } ${isCurrentUser ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${admin.is_active
                                  ? "translate-x-6"
                                  : "translate-x-1"
                                }`}
                            />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => handleEditAdmin(admin)}
                              variant="ghost"
                              size="sm"
                              disabled={isCurrentUser}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteClick(admin)}
                              variant="ghost"
                              size="sm"
                              disabled={isCurrentUser}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  {modalMode === "add" ? "Add New Admin" : "Edit Admin"}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="admin@example.com"
                    className={formErrors.email ? "border-red-500" : ""}
                    disabled={modalMode === "edit"}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {modalMode === "add" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="Min 8 characters"
                        className={formErrors.password ? "border-red-500" : ""}
                      />
                      {formErrors.password && (
                        <p className="text-sm text-red-600 mt-1">
                          {formErrors.password}
                        </p>
                      )}
                      {formData.password && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">
                              Password Strength
                            </span>
                            <span
                              className={`font-semibold ${passwordStrength >= 75
                                  ? "text-green-600"
                                  : passwordStrength >= 50
                                    ? "text-yellow-600"
                                    : "text-red-600"
                                }`}
                            >
                              {getPasswordStrengthLabel()}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${getPasswordStrengthColor()}`}
                              style={{ width: `${passwordStrength}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Re-enter password"
                        className={
                          formErrors.confirmPassword ? "border-red-500" : ""
                        }
                      />
                      {formErrors.confirmPassword && (
                        <p className="text-sm text-red-600 mt-1">
                          {formErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="super_admin">
                      Super Admin - Full Access
                    </option>
                    <option value="admin">Admin - Most Features</option>
                    <option value="moderator">
                      Moderator - Limited Access
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permissions
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {ALL_PERMISSIONS.map((permission) => {
                      const isChecked = formData.permissions.includes(
                        permission.id,
                      );
                      const isDisabled =
                        permission.id === "manage_admins" &&
                        formData.role !== "super_admin";

                      return (
                        <div
                          key={permission.id}
                          className={`flex items-start gap-3 p-3 rounded-lg ${isDisabled
                              ? "bg-gray-50 opacity-50"
                              : "hover:bg-gray-50"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              handleTogglePermission(permission.id)
                            }
                            disabled={isDisabled}
                            className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">
                              {permission.label}
                              {isDisabled && (
                                <span className="ml-2 text-xs text-gray-500">
                                  (Super Admin only)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {modalMode === "add" && (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">
                        Send Welcome Email
                      </p>
                      <p className="text-sm text-gray-500">
                        Send login credentials to admin
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          send_welcome_email: !formData.send_welcome_email,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.send_welcome_email
                          ? "bg-green-600"
                          : "bg-gray-300"
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.send_welcome_email
                            ? "translate-x-6"
                            : "translate-x-1"
                          }`}
                      />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
                <Button onClick={() => setShowModal(false)} variant="secondary">
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAdmin}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {modalMode === "add" ? "Create Admin" : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && adminToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-red-600">
                  Delete Admin
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-900">Warning</p>
                    <p className="text-sm text-red-700 mt-1">
                      Admin "{adminToDelete.email}" will lose access
                      immediately.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reassign pending tasks to:
                  </label>
                  <select
                    value={reassignAdminId}
                    onChange={(e) => setReassignAdminId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select admin...</option>
                    {admins
                      .filter((a) => a.id !== adminToDelete.id && a.is_active)
                      .map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.email} ({ROLES[admin.role].label})
                        </option>
                      ))}
                  </select>
                </div>

                <p className="text-sm text-gray-600">
                  This action cannot be undone.
                </p>
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAdmin}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Admin
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Matrix Modal */}
        {showPermissionsMatrix && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  Permissions Matrix
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Overview of role-based permissions
                </p>
              </div>

              <div className="p-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Permission
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-red-700">
                        Super Admin
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-blue-700">
                        Admin
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-green-700">
                        Moderator
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ALL_PERMISSIONS.map((permission) => (
                      <tr key={permission.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 text-sm">
                            {permission.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {permission.description}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {permission.id === "manage_admins" ? (
                            <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {[
                            "manage_users",
                            "approve_kyc",
                            "view_reports",
                          ].includes(permission.id) ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end">
                <Button
                  onClick={() => setShowPermissionsMatrix(false)}
                  variant="secondary"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
