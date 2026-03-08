"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  profileTab: React.ReactNode;
  appointmentsTab: React.ReactNode;
  metricsTab: React.ReactNode;
  labels: { profile: string; appointments: string; metrics: string };
};

export function PatientProfileTabs({
  profileTab,
  appointmentsTab,
  metricsTab,
  labels,
}: Props) {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="h-11 w-full rounded-xl bg-muted/60 p-1">
        <TabsTrigger value="profile" className="flex-1 rounded-lg text-sm font-medium">
          {labels.profile}
        </TabsTrigger>
        <TabsTrigger value="appointments" className="flex-1 rounded-lg text-sm font-medium">
          {labels.appointments}
        </TabsTrigger>
        <TabsTrigger value="metrics" className="flex-1 rounded-lg text-sm font-medium">
          {labels.metrics}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-4 space-y-4">
        {profileTab}
      </TabsContent>

      <TabsContent value="appointments" className="mt-4">
        {appointmentsTab}
      </TabsContent>

      <TabsContent value="metrics" className="mt-4 space-y-4">
        {metricsTab}
      </TabsContent>
    </Tabs>
  );
}
