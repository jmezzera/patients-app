import { auth } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { getSessionActor } from "@/lib/authz";
import { db } from "@/lib/db";
import { listPatients } from "@/lib/repos/patients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const signInRoute = "/sign-in" as Route;

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect(signInRoute);
  }

  try {
    const actor = await getSessionActor();
    if (actor.role === Role.PATIENT) {
      redirect("/me");
    }

    const [patients, totalAppointments, completedAppointments, recentAppointments] =
      await Promise.all([
        listPatients(actor),
        db.appointment.count({ where: { orgId: actor.orgId } }),
        db.appointment.count({
          where: {
            orgId: actor.orgId,
            completedAt: { not: null },
          },
        }),
        db.appointment.findMany({
          where: { orgId: actor.orgId },
          include: { patient: true },
          orderBy: { scheduledAt: "desc" },
          take: 6,
        }),
      ]);

    const measurementCount = await db.measurementEntry.count({
      where: { orgId: actor.orgId },
    });

    return (
      <main className="container py-8">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Workspace</CardTitle>
              <CardDescription>Clinical records</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="secondary" className="justify-start">
                Dashboard
              </Button>
              <Button asChild variant="ghost" className="justify-start">
                <a href="/patients">Patients</a>
              </Button>
              <Button asChild variant="ghost" className="justify-start">
                <a href="/trends">Trends</a>
              </Button>
            </CardContent>
          </Card>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Snapshot of patient activity and care progress.
                </p>
              </div>
              <Badge variant="secondary">{actor.role.toLowerCase()}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total patients</CardDescription>
                  <CardTitle className="text-3xl">{patients.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Appointments completed</CardDescription>
                  <CardTitle className="text-3xl">
                    {completedAppointments}/{totalAppointments}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Measurements logged</CardDescription>
                  <CardTitle className="text-3xl">{measurementCount}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent appointments</CardTitle>
                <CardDescription>Latest scheduled patient visits</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          {appointment.patient.firstName} {appointment.patient.lastName}
                        </TableCell>
                        <TableCell>
                          {new Date(appointment.scheduledAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {appointment.completedAt ? (
                            <Badge>Completed</Badge>
                          ) : (
                            <Badge variant="outline">Scheduled</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Separator className="my-4" />
                <Button asChild variant="outline">
                  <a href="/patients">Open all patient records</a>
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    );
  } catch {
    redirect("/");
  }
}
