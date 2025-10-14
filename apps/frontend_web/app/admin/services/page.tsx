"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "../components";
import {
  Search,
  Filter,
  Plus,
  Star,
  Users,
  TrendingUp,
  Eye,
  Trash2,
  MoreVertical,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: {
    min: number;
    max: number;
    type: "hourly" | "fixed" | "negotiable";
  };
  rating: number;
  reviewsCount: number;
  providersCount: number;
  status: "active" | "inactive" | "pending";
  createdAt: string;
  image: string;
  featured: boolean;
}

const mockServices: Service[] = [
  {
    id: "1",
    name: "House Cleaning",
    category: "Home Services",
    description:
      "Professional house cleaning services for residential properties",
    price: { min: 50, max: 200, type: "hourly" },
    rating: 4.8,
    reviewsCount: 245,
    providersCount: 48,
    status: "active",
    createdAt: "2024-01-15",
    image: "/service-placeholder.jpg",
    featured: true,
  },
  {
    id: "2",
    name: "Plumbing Repair",
    category: "Maintenance",
    description:
      "Expert plumbing services for all types of repairs and installations",
    price: { min: 80, max: 300, type: "fixed" },
    rating: 4.6,
    reviewsCount: 189,
    providersCount: 32,
    status: "active",
    createdAt: "2024-01-10",
    image: "/service-placeholder.jpg",
    featured: false,
  },
  {
    id: "3",
    name: "Garden Maintenance",
    category: "Outdoor Services",
    description: "Complete garden care including landscaping and maintenance",
    price: { min: 60, max: 150, type: "negotiable" },
    rating: 4.7,
    reviewsCount: 156,
    providersCount: 24,
    status: "active",
    createdAt: "2024-01-08",
    image: "/service-placeholder.jpg",
    featured: true,
  },
  {
    id: "4",
    name: "Personal Training",
    category: "Fitness",
    description: "One-on-one fitness training sessions with certified trainers",
    price: { min: 100, max: 250, type: "hourly" },
    rating: 4.9,
    reviewsCount: 98,
    providersCount: 16,
    status: "pending",
    createdAt: "2024-01-05",
    image: "/service-placeholder.jpg",
    featured: false,
  },
  {
    id: "5",
    name: "Electrical Work",
    category: "Maintenance",
    description: "Licensed electrical services for homes and businesses",
    price: { min: 90, max: 400, type: "fixed" },
    rating: 4.5,
    reviewsCount: 234,
    providersCount: 28,
    status: "active",
    createdAt: "2024-01-03",
    image: "/service-placeholder.jpg",
    featured: false,
  },
  {
    id: "6",
    name: "Pet Sitting",
    category: "Pet Care",
    description: "Reliable pet sitting and care services while you're away",
    price: { min: 30, max: 80, type: "hourly" },
    rating: 4.8,
    reviewsCount: 176,
    providersCount: 42,
    status: "inactive",
    createdAt: "2023-12-28",
    image: "/service-placeholder.jpg",
    featured: true,
  },
];

const categories = [
  "All Categories",
  "Home Services",
  "Maintenance",
  "Outdoor Services",
  "Fitness",
  "Pet Care",
  "Automotive",
  "Beauty",
  "Technology",
];

export default function ServicesPage() {
  const [services] = useState<Service[]>(mockServices);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All Categories" ||
      service.category === selectedCategory;
    const matchesStatus =
      selectedStatus === "all" || service.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: services.length,
    active: services.filter((s) => s.status === "active").length,
    pending: services.filter((s) => s.status === "pending").length,
    inactive: services.filter((s) => s.status === "inactive").length,
    featured: services.filter((s) => s.featured).length,
  };

  const formatPrice = (price: Service["price"]) => {
    if (price.type === "negotiable") return "Negotiable";
    if (price.min === price.max) return `$${price.min}`;
    return `$${price.min} - $${price.max}`;
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Services Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage all services offered on the platform
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Service
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Services
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.active}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.inactive}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Users className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Featured</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.featured}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>

            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </Card>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative">
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <Star className="w-12 h-12 text-gray-400" />
                </div>
                {service.featured && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                    Featured
                  </div>
                )}
                <div
                  className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-full ${
                    service.status === "active"
                      ? "bg-green-100 text-green-800"
                      : service.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {service.status.charAt(0).toUpperCase() +
                    service.status.slice(1)}
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {service.name}
                  </h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm text-blue-600 mb-2">{service.category}</p>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {service.description}
                </p>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">
                      {service.rating}
                    </span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600">
                    {service.reviewsCount} reviews
                  </span>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-sm text-gray-600">
                      {service.providersCount} providers
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatPrice(service.price)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {service.price.type === "hourly"
                        ? "per hour"
                        : service.price.type === "fixed"
                          ? "fixed price"
                          : ""}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <Card className="p-12 text-center">
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No services found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters to find what you're looking
              for.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
