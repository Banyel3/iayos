"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Settings,
  DollarSign,
  Building2,
} from "lucide-react";
import { Sidebar } from "../../../components";

interface PaymentGateway {
  name: string;
  enabled: boolean;
  api_key_configured: boolean;
  config: any;
  webhook_url?: string;
  transaction_count?: number;
  last_transaction?: string;
}

interface GatewaysResponse {
  success: boolean;
  xendit: PaymentGateway;
  gcash: PaymentGateway;
  bank_transfer: PaymentGateway;
}

export default function PaymentGatewaysPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [gateways, setGateways] = useState<GatewaysResponse | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState(false);

  // Form states
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8000/api/adminpanel/settings/payment-gateways",
        {
          credentials: "include",
        }
      );
      const data: GatewaysResponse = await response.json();

      if (data.success) {
        setGateways(data);
      }
    } catch (error) {
      console.error("Error fetching gateways:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGateway = async (
    gateway: string,
    currentEnabled: boolean
  ) => {
    if (
      currentEnabled &&
      !confirm(
        "Disable this payment gateway? Users will not be able to use it for payments."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/adminpanel/settings/payment-gateways/${gateway}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ enabled: !currentEnabled }),
        }
      );

      const data = await response.json();

      if (data.success) {
        fetchGateways();
      } else {
        alert(data.error || "Failed to update gateway");
      }
    } catch (error) {
      console.error("Error toggling gateway:", error);
      alert("Failed to update gateway");
    }
  };

  const handleConfigure = (gateway: string) => {
    setSelectedGateway(gateway);

    // Set form data based on gateway
    if (gateways) {
      const gatewayData = gateways[gateway as keyof GatewaysResponse];
      if (typeof gatewayData === "object" && gatewayData !== null) {
        setFormData({
          enabled: gatewayData.enabled,
          ...gatewayData.config,
        });
      }
    }

    setShowConfigModal(true);
  };

  const handleSaveConfig = async () => {
    if (!selectedGateway) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/adminpanel/settings/payment-gateways/${selectedGateway}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Gateway configuration saved successfully!");
        setShowConfigModal(false);
        fetchGateways();
      } else {
        alert(data.error || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Failed to save configuration");
    }
  };

  const handleTestConnection = async () => {
    if (!selectedGateway) return;

    setTesting(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/adminpanel/settings/payment-gateways/${selectedGateway}/test`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("✓ Connection test successful!");
      } else {
        alert("✗ Connection test failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      alert("✗ Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const maskApiKey = (key: string) => {
    if (!key) return "";
    const visible = key.slice(-4);
    return "•".repeat(Math.max(0, key.length - 4)) + visible;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                <CreditCard className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">
                Loading payment gateways...
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Fetching gateway configurations
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!gateways) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-8 shadow-xl">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-green-500 opacity-20 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-teal-500 opacity-20 blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-sm">
              <CreditCard className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">
                Payment Processing
              </span>
            </div>
            <h1 className="mb-2 text-4xl font-bold text-white">
              Payment Gateways
            </h1>
            <p className="text-lg text-green-100">
              Configure payment methods and processing settings
            </p>
          </div>
        </div>

        {/* Gateway Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Xendit Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Xendit</CardTitle>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Online Payments
                    </p>
                  </div>
                </div>
                {gateways.xendit.enabled ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">Status</p>
                  <p
                    className={`text-xs mt-0.5 ${gateways.xendit.enabled ? "text-green-600" : "text-gray-500"}`}
                  >
                    {gateways.xendit.enabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleToggleGateway("xendit", gateways.xendit.enabled)
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    gateways.xendit.enabled ? "bg-green-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      gateways.xendit.enabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">API Key</span>
                  {gateways.xendit.api_key_configured ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Configured
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      Not Set
                    </span>
                  )}
                </div>

                {gateways.xendit.webhook_url && (
                  <div className="p-2 bg-gray-50 rounded border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Webhook URL</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-gray-800 truncate flex-1">
                        {gateways.xendit.webhook_url}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(gateways.xendit.webhook_url!)
                        }
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Copy className="h-3 w-3 text-gray-600" />
                      </button>
                    </div>
                  </div>
                )}

                {gateways.xendit.transaction_count !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Transactions</span>
                    <span className="font-semibold text-gray-900">
                      {gateways.xendit.transaction_count}
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={() => handleConfigure("xendit")}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Settings className="h-4 w-4" />
                Configure
              </Button>

              <a
                href="https://docs.xendit.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="h-4 w-4" />
                Documentation
              </a>
            </CardContent>
          </Card>

          {/* GCash Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b bg-gradient-to-r from-sky-50 to-cyan-50 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-sky-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">GCash</CardTitle>
                    <p className="text-sm text-gray-500 mt-0.5">E-Wallet</p>
                  </div>
                </div>
                {gateways.gcash.enabled ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">Status</p>
                  <p
                    className={`text-xs mt-0.5 ${gateways.gcash.enabled ? "text-green-600" : "text-gray-500"}`}
                  >
                    {gateways.gcash.enabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleToggleGateway("gcash", gateways.gcash.enabled)
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    gateways.gcash.enabled ? "bg-green-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      gateways.gcash.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Merchant ID</span>
                  {gateways.gcash.config?.merchant_id ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Set
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      Not Set
                    </span>
                  )}
                </div>

                {gateways.gcash.transaction_count !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Transactions</span>
                    <span className="font-semibold text-gray-900">
                      {gateways.gcash.transaction_count}
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={() => handleConfigure("gcash")}
                className="w-full gap-2 bg-sky-600 hover:bg-sky-700 text-white"
              >
                <Settings className="h-4 w-4" />
                Configure
              </Button>

              <a
                href="https://www.gcash.com/business"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-sky-600 hover:text-sky-700"
              >
                <ExternalLink className="h-4 w-4" />
                Documentation
              </a>
            </CardContent>
          </Card>

          {/* Bank Transfer Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Bank Transfer</CardTitle>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Direct Banking
                    </p>
                  </div>
                </div>
                {gateways.bank_transfer.enabled ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">Status</p>
                  <p
                    className={`text-xs mt-0.5 ${gateways.bank_transfer.enabled ? "text-green-600" : "text-gray-500"}`}
                  >
                    {gateways.bank_transfer.enabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleToggleGateway(
                      "bank_transfer",
                      gateways.bank_transfer.enabled
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    gateways.bank_transfer.enabled
                      ? "bg-green-600"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      gateways.bank_transfer.enabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Bank Accounts</span>
                  <span className="font-semibold text-gray-900">
                    {gateways.bank_transfer.config?.accounts?.length || 0}
                  </span>
                </div>

                {gateways.bank_transfer.transaction_count !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Transactions</span>
                    <span className="font-semibold text-gray-900">
                      {gateways.bank_transfer.transaction_count}
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={() => handleConfigure("bank_transfer")}
                className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Settings className="h-4 w-4" />
                Manage Accounts
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Modal */}
        {showConfigModal && selectedGateway && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900 capitalize">
                  Configure {selectedGateway.replace("_", " ")}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {/* Xendit Config */}
                {selectedGateway === "xendit" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key
                      </label>
                      <div className="relative">
                        <Input
                          type={showApiKeys.api_key ? "text" : "password"}
                          value={formData.api_key || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              api_key: e.target.value,
                            })
                          }
                          placeholder="xnd_..."
                          className="pr-10"
                        />
                        <button
                          onClick={() =>
                            setShowApiKeys({
                              ...showApiKeys,
                              api_key: !showApiKeys.api_key,
                            })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showApiKeys.api_key ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secret Key
                      </label>
                      <div className="relative">
                        <Input
                          type={showApiKeys.secret_key ? "text" : "password"}
                          value={formData.secret_key || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              secret_key: e.target.value,
                            })
                          }
                          placeholder="xnd_secret_..."
                          className="pr-10"
                        />
                        <button
                          onClick={() =>
                            setShowApiKeys({
                              ...showApiKeys,
                              secret_key: !showApiKeys.secret_key,
                            })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showApiKeys.secret_key ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* GCash Config */}
                {selectedGateway === "gcash" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Merchant ID
                      </label>
                      <Input
                        value={formData.merchant_id || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            merchant_id: e.target.value,
                          })
                        }
                        placeholder="Enter merchant ID..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key
                      </label>
                      <div className="relative">
                        <Input
                          type={showApiKeys.api_key ? "text" : "password"}
                          value={formData.api_key || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              api_key: e.target.value,
                            })
                          }
                          placeholder="Enter API key..."
                          className="pr-10"
                        />
                        <button
                          onClick={() =>
                            setShowApiKeys({
                              ...showApiKeys,
                              api_key: !showApiKeys.api_key,
                            })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showApiKeys.api_key ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Bank Transfer Config */}
                {selectedGateway === "bank_transfer" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Accounts
                    </label>
                    <p className="text-sm text-gray-500 mb-3">
                      Add or manage bank accounts for receiving payments
                    </p>
                    {/* Simplified for now - could add full CRUD for bank accounts */}
                    <textarea
                      value={JSON.stringify(formData.accounts || [], null, 2)}
                      onChange={(e) => {
                        try {
                          setFormData({
                            ...formData,
                            accounts: JSON.parse(e.target.value),
                          });
                        } catch {}
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                      rows={8}
                      placeholder='[{"bank": "BDO", "account_number": "1234567890", "account_name": "Company Name"}]'
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">Enable Gateway</p>
                    <p className="text-sm text-gray-500">
                      Make this gateway available for users
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setFormData({ ...formData, enabled: !formData.enabled })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.enabled ? "bg-green-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3 justify-between">
                {selectedGateway !== "bank_transfer" && (
                  <Button
                    onClick={handleTestConnection}
                    disabled={testing}
                    variant="secondary"
                    className="gap-2"
                  >
                    {testing ? "Testing..." : "Test Connection"}
                  </Button>
                )}
                <div className="flex gap-3 ml-auto">
                  <Button
                    onClick={() => setShowConfigModal(false)}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveConfig}
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Settings className="h-4 w-4" />
                    Save Configuration
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
