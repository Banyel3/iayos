"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
import { HelpCircle, MessageSquare, Mail, Phone, ExternalLink } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-muted-foreground">
            Get help and support for platform administration
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Support tickets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4h</div>
            <p className="text-xs text-muted-foreground">Average response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <HelpCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">Issues resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <HelpCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">Out of 5.0</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>Get in touch with our support team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">Email Support</div>
                <div className="text-sm text-muted-foreground">support@iayos.com</div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <Phone className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">Phone Support</div>
                <div className="text-sm text-muted-foreground">+1 (555) 123-4567</div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <div>
                <div className="font-medium">Live Chat</div>
                <div className="text-sm text-muted-foreground">Available 24/7</div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Help</CardTitle>
            <CardDescription>Common questions and resources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "How to manage user accounts?",
              "Setting up payment processing",
              "Configuring system notifications",
              "Understanding analytics reports",
              "Managing KYC verifications"
            ].map((question, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">{question}</span>
                <Button variant="outline" size="sm">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}