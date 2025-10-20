import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  fetchWorkerMaterials,
  addWorkerMaterial,
  deleteWorkerMaterial,
} from "@/lib/worker-materials-api";

interface Material {
  productID: number;
  name: string;
  qty?: number;
  unit?: string;
  price?: number;
}

export default function WorkerMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Fetch materials from API on mount
  useEffect(() => {
    setLoading(true);
    fetchWorkerMaterials()
      .then((data) => {
        setMaterials(data);
      })
      .catch((err) => {
        console.error("Failed to load materials", err);
        setMaterials([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("");
  const unitOptions = [
    "pcs",
    "rolls",
    "box",
    "set",
    "meter",
    "liter",
    "kg",
    "g",
    "ml",
    "pack",
    "bottle",
    "sheet",
    "ft",
    "cm",
    "other",
  ];
  const [price, setPrice] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingMaterial, setPendingMaterial] = useState<Material | null>(null);
  // Remove confirmation state
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [materialToRemove, setMaterialToRemove] = useState<Material | null>(
    null
  );

  const addMaterial = () => {
    if (!name.trim()) return;
    // If remove modal is open, close it
    if (showRemoveConfirm) {
      setShowRemoveConfirm(false);
      setMaterialToRemove(null);
    }
    const newMat = {
      name: name.trim(),
      qty: qty ? Number(qty) : undefined,
      unit: unit || undefined,
      price: price ? Number(price) : undefined,
    };
    setPendingMaterial(newMat as any);
    setShowConfirm(true);
  };

  const confirmAdd = async () => {
    if (!pendingMaterial) return;
    try {
      const added = await addWorkerMaterial(pendingMaterial);
      setMaterials((s) => [added, ...s]);
      setError(null);
    } catch (e) {
      setError("Failed to add material");
    }
    // clear inputs
    setName("");
    setQty("");
    setUnit("");
    setPrice("");
    setShowConfirm(false);
    setShowModal(false);
    setPendingMaterial(null);
  };

  const cancelConfirm = () => {
    setShowConfirm(false);
    setPendingMaterial(null);
  };

  // Remove confirmation logic
  const askRemoveMaterial = (mat: Material) => {
    // If add modal is open, close it
    if (showConfirm) {
      setShowConfirm(false);
      setPendingMaterial(null);
    }
    setMaterialToRemove(mat);
    setShowRemoveConfirm(true);
  };
  const confirmRemove = async () => {
    if (materialToRemove) {
      try {
        await deleteWorkerMaterial(materialToRemove.productID);
        setMaterials((s) =>
          s.filter((m) => m.productID !== materialToRemove.productID)
        );
        setError(null);
      } catch (e) {
        setError("Failed to remove material");
      }
    }
    setShowRemoveConfirm(false);
    setMaterialToRemove(null);
  };
  const cancelRemove = () => {
    setShowRemoveConfirm(false);
    setMaterialToRemove(null);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex items-center justify-between gap-4 px-6 py-4">
        <div>
          <CardTitle className="text-base">Materials</CardTitle>
          <p className="text-xs text-gray-500">
            Add materials you commonly use for jobs
          </p>
        </div>
        <CardAction>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition"
          >
            <span className="text-lg">+</span>
            <span>Add</span>
          </button>
        </CardAction>
      </CardHeader>

      <CardContent className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500">Loading materials...</div>
          </div>
        ) : materials.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <div className="text-sm text-gray-500/70">No materials found</div>
          </div>
        ) : (
          <div className="grid gap-3">
            {materials.map((m) => {
              const subtotal = (m.qty || 1) * (m.price || 0);
              return (
                <div
                  key={m.productID}
                  className="flex items-center justify-between bg-white shadow-sm border border-gray-100 rounded-md px-4 py-3"
                >
                  <div className="flex items-start gap-4">
                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 py-1 px-2">
                      {m.name}
                    </Badge>
                    <div className="text-sm text-gray-600">
                      {m.qty !== undefined && (
                        <div className="">
                          {m.qty}
                          {m.unit ? ` ${m.unit}` : ""}
                        </div>
                      )}
                      {m.price !== undefined && (
                        <div className="text-xs text-gray-500">
                          ₱{m.price.toFixed(2)} / unit
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-gray-900">
                      ₱{subtotal.toFixed(2)}
                    </div>
                    <button
                      onClick={() => askRemoveMaterial(m)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end pt-1">
              <div className="text-sm font-semibold text-gray-900">
                Total: ₱
                {materials
                  .reduce((acc, m) => acc + (m.qty || 1) * (m.price || 0), 0)
                  .toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-20">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Material
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                addMaterial();
              }}
            >
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Screws, Tape"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Qty
                  </label>
                  <Input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="e.g. 10"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                  >
                    <option value="" disabled>
                      Select unit
                    </option>
                    {unitOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Price (₱ per unit)
                </label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 25.00"
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Confirmation Modal */}
      {showConfirm && pendingMaterial && !showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg border border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Add Material
            </h4>
            <div className="text-sm text-gray-700 mb-4">
              <p className="font-medium">{pendingMaterial.name}</p>
              {pendingMaterial.qty !== undefined && (
                <p className="text-xs text-gray-600">
                  Qty: {pendingMaterial.qty} {pendingMaterial.unit || ""}
                </p>
              )}
              {pendingMaterial.price !== undefined && (
                <p className="text-xs text-gray-600">
                  Price: ₱{pendingMaterial.price.toFixed(2)} / unit
                </p>
              )}
              <p className="text-sm font-semibold text-gray-900 mt-3">
                Subtotal: ₱
                {(
                  (pendingMaterial.qty || 1) * (pendingMaterial.price || 0)
                ).toFixed(2)}
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelConfirm}
                className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmAdd}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && materialToRemove && !showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg border border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Remove Material
            </h4>
            <div className="text-sm text-gray-700 mb-4">
              <p className="font-medium">{materialToRemove.name}</p>
              {materialToRemove.qty !== undefined && (
                <p className="text-xs text-gray-600">
                  Qty: {materialToRemove.qty} {materialToRemove.unit || ""}
                </p>
              )}
              {materialToRemove.price !== undefined && (
                <p className="text-xs text-gray-600">
                  Price: ₱{materialToRemove.price.toFixed(2)} / unit
                </p>
              )}
              <p className="text-sm font-semibold text-gray-900 mt-3">
                Subtotal: ₱
                {(
                  (materialToRemove.qty || 1) * (materialToRemove.price || 0)
                ).toFixed(2)}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelRemove}
                className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                className="px-4 py-2 bg-red-600 text-white rounded-md"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
