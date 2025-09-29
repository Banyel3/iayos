"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { Save, Users, Shield, Bell, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Configure platform settings and preferences
          </p>
        </div>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Management</span>
            </CardTitle>
            <CardDescription>Configure user registration and account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Auto-approve new users</div>
                <div className="text-sm text-muted-foreground">Automatically approve user registrations</div>
              </div>
              <input type="checkbox" className="toggle" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email verification required</div>
                <div className="text-sm text-muted-foreground">Require email verification for new accounts</div>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security Settings</span>
            </CardTitle>
            <CardDescription>Configure security and authentication settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Two-factor authentication</div>
                <div className="text-sm text-muted-foreground">Require 2FA for admin accounts</div>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Session timeout</div>
                <div className="text-sm text-muted-foreground">Automatic logout after inactivity</div>
              </div>
              <select className="px-3 py-1 border rounded">
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>2 hours</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notification Settings</span>
            </CardTitle>
            <CardDescription>Configure system notifications and alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email notifications</div>
                <div className="text-sm text-muted-foreground">Send email notifications to admins</div>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">System alerts</div>
                <div className="text-sm text-muted-foreground">Show system status alerts</div>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>System Maintenance</span>
            </CardTitle>
            <CardDescription>System maintenance and backup settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full">
                Run System Backup
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Clear Cache
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Update System
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}