import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Material {
  id: string;
  name: string;
  qty?: number;
  unit?: string;
  // price per unit in PHP
  price?: number;
}

export default function WorkerMaterials() {
  const [materials, setMaterials] = useState<Material[]>([
    { id: "1", name: "Screws (assorted)", qty: 50, unit: "pcs", price: 0.5 },
    { id: "2", name: "Electrical Tape", qty: 5, unit: "rolls", price: 25 },
  ]);

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
    const newMat: Material = {
      id: Date.now().toString(),
      name: name.trim(),
      qty: qty ? Number(qty) : undefined,
      unit: unit || undefined,
      price: price ? Number(price) : undefined,
    };
    setPendingMaterial(newMat);
    setShowConfirm(true);
  };

  const confirmAdd = () => {
    if (!pendingMaterial) return;
    setMaterials((s) => [pendingMaterial, ...s]);
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
  const confirmRemove = () => {
    if (materialToRemove) {
      setMaterials((s) => s.filter((m) => m.id !== materialToRemove.id));
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
      <CardHeader className="flex items-start justify-between px-6">
        <div>
          <CardTitle>Materials</CardTitle>
        </div>
        <CardAction>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            + Add Material
          </button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-6 py-3">
        {materials.length === 0 ? (
          <p className="text-sm text-gray-500">No materials added yet.</p>
        ) : (
          <div className="space-y-2">
            {materials.map((m) => {
              const subtotal = (m.qty || 1) * (m.price || 0);
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                      {m.name}
                    </Badge>
                    <div className="text-xs text-gray-600">
                      {m.qty !== undefined && (
                        <span>
                          {m.qty}
                          {m.unit ? ` ${m.unit}` : ""}
                        </span>
                      )}
                      {m.price !== undefined && (
                        <div className="text-xs text-gray-500">
                          ₱{m.price.toFixed(2)} / unit
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-gray-900">
                      ₱{subtotal.toFixed(2)}
                    </div>
                    <button
                      onClick={() => askRemoveMaterial(m)}
                      className="text-red-500 text-xs hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Total */}
            <div className="flex justify-end pt-2">
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
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/20 flex items-start justify-center z-[9999] p-4 pt-20">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Material
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
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

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={addMaterial}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Confirmation Modal */}
      {showConfirm && pendingMaterial && !showRemoveConfirm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/20 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-gray-200">
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

            <div className="flex space-x-3">
              <button
                onClick={cancelConfirm}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmAdd}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && materialToRemove && !showConfirm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/20 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-gray-200">
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
            <div className="flex space-x-3">
              <button
                onClick={cancelRemove}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg"
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
