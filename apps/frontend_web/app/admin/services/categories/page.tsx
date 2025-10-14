"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Input } from "@/components/ui/input";
import { Briefcase, Search, Trash2, Plus, TrendingUp } from "lucide-react";
import { Sidebar } from "../../components";

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  jobCount: number;
  workerCount: number;
  status: "active" | "inactive";
}

const mockCategories: ServiceCategory[] = [
  {
    id: "cat001",
    name: "Appliance Repair",
    description: "Repair and maintenance of household appliances",
    jobCount: 342,
    workerCount: 156,
    status: "active",
  },
  {
    id: "cat002",
    name: "Plumbing",
    description: "Plumbing installation, repair, and maintenance",
    jobCount: 287,
    workerCount: 134,
    status: "active",
  },
  {
    id: "cat003",
    name: "Electrical Work",
    description: "Electrical installation, repair, and troubleshooting",
    jobCount: 254,
    workerCount: 98,
    status: "active",
  },
  {
    id: "cat004",
    name: "Carpentry",
    description: "Wood working, furniture repair, and custom builds",
    jobCount: 198,
    workerCount: 87,
    status: "active",
  },
  {
    id: "cat005",
    name: "Painting",
    description: "Interior and exterior painting services",
    jobCount: 165,
    workerCount: 72,
    status: "active",
  },
];

export default function ServiceCategoriesPage() {
  const [categories] = useState<ServiceCategory[]>(mockCategories);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalJobs = categories.reduce((sum, cat) => sum + cat.jobCount, 0);
  const totalWorkers = categories.reduce(
    (sum, cat) => sum + cat.workerCount,
    0
  );

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Service Categories</h1>
              <p className="text-muted-foreground">Manage service types</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Categories
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categories.length}</div>
                <p className="text-xs text-muted-foreground">Active services</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Jobs
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalJobs}</div>
                <p className="text-xs text-muted-foreground">
                  Across all categories
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Workers
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalWorkers}</div>
                <p className="text-xs text-muted-foreground">
                  Registered workers
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Search Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search service categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredCategories.map((category) => (
              <Card key={category.id}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {category.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                        {category.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Jobs
                        </p>
                        <p className="text-2xl font-bold">
                          {category.jobCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Workers</p>
                        <p className="text-2xl font-bold">
                          {category.workerCount}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
