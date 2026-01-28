// Centralized API utility for worker materials
import { API_BASE } from "@/lib/api/config";

const API_BASE_URL = API_BASE;

export async function fetchWorkerMaterials() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/profiles/profile/products/`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res.ok) {
      return await res.json();
    } else {
      let body = null;
      try {
        body = await res.json();
      } catch (e) {
        body = await res.text().catch(() => null);
      }
      console.error("Failed to fetch materials", { status: res.status, body });
      return [];
    }
  } catch (err) {
    console.error("Failed to fetch materials", err);
    return [];
  }
}

export async function addWorkerMaterial(data: {
  name: string;
  qty?: number;
  unit?: string;
  price?: number;
}) {
  const res = await fetch(`${API_BASE_URL}/api/profiles/profile/products/add`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add material");
  return res.json();
}

export async function deleteWorkerMaterial(productID: number) {
  const res = await fetch(
    `${API_BASE_URL}/api/profiles/profile/products/${productID}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );
  if (!res.ok) throw new Error("Failed to delete material");
  return res.json();
}
