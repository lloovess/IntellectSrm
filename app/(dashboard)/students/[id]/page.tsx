import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/guard";
import { studentProfileService } from "@/lib/services/student-profile.service";

import { ProfileHeader } from "./_components/profile-header";
import { ContactsCard } from "./_components/contacts-card";
import { EnrollmentHistoryCard } from "./_components/enrollment-history-card";
import { FinancialOverviewCard } from "./_components/financial-overview-card";
import { QuickActionsCard } from "./_components/quick-actions-card";
import { ActivityTimeline } from "./_components/activity-timeline";
import { InteractionLogger } from "./_components/interaction-logger";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StudentProfilePage({ params }: Props) {
  const { id } = await params;
  const { role } = await requireAuth();

  const profile = await studentProfileService.getProfile(id, role);
  if (!profile) notFound();

  const canEdit = checkPermission(role, "students.write");
  const canViewFinance = checkPermission(role, "payments.read");

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Profile header + General info card */}
      <ProfileHeader profile={profile} canEdit={canEdit} />

      {/* Main 2/3 + 1/3 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column (2/3) ──────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <ContactsCard profile={profile} />
          <EnrollmentHistoryCard profile={profile} />
        </div>

        {/* ── Right column (1/3) ─────────────────────────── */}
        <div className="lg:col-span-1 space-y-6">
          {canViewFinance && (
            <FinancialOverviewCard profile={profile} />
          )}
          <QuickActionsCard
            studentId={id}
            role={role}
            hasActiveContract={!!profile.contract}
            enrollmentId={profile.enrollment?.id ?? null}
            currentGrade={profile.enrollment?.grade}
            currentBranch={profile.enrollment?.branchName ?? undefined}
          />
          <InteractionLogger studentId={id} />
          <ActivityTimeline events={profile.activity} />
        </div>
      </div>
    </div>
  );
}
