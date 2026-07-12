import { FileText, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import type { Resume } from "@/types/resume";

interface StatsCardsProps {
  resumes: Resume[];
}

export function StatsCards({ resumes }: StatsCardsProps) {
  const total = resumes.length;

  const lastUpdated =
    resumes.length > 0
      ? new Date(
          Math.max(...resumes.map((r) => new Date(r.updatedAt).getTime())),
        ).toLocaleDateString()
      : "Never";

  const stats = [
    {
      label: "Total Resumes",
      value: total,
      icon: FileText,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Last Updated",
      value: lastUpdated,
      icon: Clock,
      color: "from-violet-500 to-violet-600",
      bgColor: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      label: "With Target Role",
      value: resumes.filter((r) => r.targetRole).length,
      icon: TrendingUp,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "This Month",
      value: resumes.filter((r) => {
        const created = new Date(r.createdAt);
        const now = new Date();
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      }).length,
      icon: CheckCircle2,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bgColor}`}
            >
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
