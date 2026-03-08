import { auth } from "@clerk/nextjs/server";
import { Role, AppointmentStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { getTranslations } from "next-intl/server";
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
    const [t, tc] = await Promise.all([
      getTranslations("dashboard"),
      getTranslations("common"),
    ]);

    function appointmentStatusBadge(status: AppointmentStatus) {
      if (status === AppointmentStatus.COMPLETED) return <Badge>{tc("status.completed")}</Badge>;
      if (status === AppointmentStatus.CANCELLED)
        return <Badge className="border-red-300 bg-red-100 text-red-700">{tc("status.cancelled")}</Badge>;
      return <Badge variant="secondary">{tc("status.booked")}</Badge>;
    }

    const actor = await getSessionActor();
    if (actor.role === Role.PATIENT) {
      redirect("/me");
    }

    const appointmentWhere =
      actor.role === Role.DOCTOR
        ? { orgId: actor.orgId, doctorId: actor.id }
        : { orgId: actor.orgId };

    const [patients, totalAppointments, completedAppointments, recentAppointments] =
      await Promise.all([
        listPatients(actor),
        db.appointment.count({ where: appointmentWhere }),
        db.appointment.count({
          where: { ...appointmentWhere, status: AppointmentStatus.COMPLETED },
        }),
        db.appointment.findMany({
          where: appointmentWhere,
          include: {
            participants: {
              include: { patient: true },
              take: 1,
            },
          },
          orderBy: { scheduledAt: "desc" },
          take: 6,
        }),
      ]);

    const measurementCount = await db.measurementEntry.count({
      where: { orgId: actor.orgId },
    });

    return (
      <main className="container px-4 py-6 md:px-6 md:py-8">
        <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
                <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
              </div>
              <Badge variant="secondary">{actor.role.toLowerCase()}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>{t("stats.totalPatients")}</CardDescription>
                  <CardTitle className="text-3xl">{patients.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>{t("stats.appointmentsCompleted")}</CardDescription>
                  <CardTitle className="text-3xl">
                    {completedAppointments}/{totalAppointments}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>{t("stats.measurementsLogged")}</CardDescription>
                  <CardTitle className="text-3xl">{measurementCount}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t("recentAppointments.title")}</CardTitle>
                <CardDescription>{t("recentAppointments.description")}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("recentAppointments.patient")}</TableHead>
                      <TableHead>{t("recentAppointments.date")}</TableHead>
                      <TableHead>{t("recentAppointments.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAppointments.map((appointment) => {
                      const first = appointment.participants[0]?.patient;
                      return (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            {first ? `${first.firstName} ${first.lastName}` : "—"}
                            {appointment.participants.length > 1
                              ? ` +${appointment.participants.length - 1}`
                              : ""}
                          </TableCell>
                          <TableCell>
                            {new Date(appointment.scheduledAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {appointmentStatusBadge(appointment.status)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
                <div className="border-t p-4">
                <Button asChild variant="outline">
                  <a href="/patients">{t("recentAppointments.openAll")}</a>
                </Button>
                </div>
              </CardContent>
            </Card>
        </section>
      </main>
    );
  } catch {
    redirect("/");
  }
}
