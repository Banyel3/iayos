import { NextResponse } from "next/server";

// Mock data for now
const workers = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
    skills: ["Plumbing", "Electrical", "Carpentry"],
    rating: 4.8,
    reviewCount: 127,
    location: "New York, NY",
    status: "VERIFIED",
    joinDate: "2024-01-15",
    completedJobs: 89,
  },
  {
    id: "2",
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    phone: "+1234567891",
    skills: ["Painting", "Cleaning"],
    rating: 4.6,
    reviewCount: 73,
    location: "Los Angeles, CA",
    status: "VERIFIED",
    joinDate: "2024-02-20",
    completedJobs: 56,
  },
];

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const worker = workers.find((w) => w.id === params.id);
  if (!worker) {
    return NextResponse.json({ error: "Worker not found" }, { status: 404 });
  }
  return NextResponse.json(worker);
}
