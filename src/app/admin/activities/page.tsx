import { supabase } from '@/lib/supabase';
import AddActivityModal from '@/components/admin/AddActivityModal';
import type { Activity, ActivityCategory } from '@/lib/types';
import { getCategoryCapPercent } from '@/lib/jcoin-utils';

export const dynamic = 'force-dynamic';

function CategorySection({
  title,
  category,
  activities,
  color,
}: {
  title: string;
  category: ActivityCategory;
  activities: Activity[];
  color: string;
}) {
  const filtered = activities.filter((a) => a.category === category);
  const capPercent = getCategoryCapPercent(category);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-${color}-100 text-${color}-700`}>
          {filtered.length} activities
        </span>
        {capPercent !== null && (
          <span className="text-xs text-slate-500">
            Cap: {capPercent}% of target
          </span>
        )}
        {capPercent === null && (
          <span className="text-xs text-emerald-600 font-medium">No cap</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((activity) => (
          <div
            key={activity.id}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                {activity.serial_no && (
                  <span className={`w-7 h-7 rounded-lg bg-${color}-100 text-${color}-700 flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                    {activity.serial_no}
                  </span>
                )}
                <h3 className="font-semibold text-slate-800 text-sm leading-tight">
                  {activity.title}
                </h3>
              </div>
            </div>

            {activity.description && (
              <p className="text-xs text-slate-500 mb-3">{activity.description}</p>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-500">Rate</span>
                <span className="font-bold text-slate-800">{activity.rate} JC</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-500">Unit</span>
                <span className="font-medium text-slate-700 text-right text-xs">
                  {activity.unit_label || activity.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  activity.is_system
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-violet-100 text-violet-700'
                }`}>
                  {activity.is_system ? 'System' : 'Custom'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AdminActivities() {
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .order('category')
    .order('serial_no');

  const allActivities = (activities || []) as Activity[];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Activities</h1>
          <p className="text-sm text-slate-500 mt-1">
            All eligible activities for earning J-Coins
          </p>
        </div>
        <AddActivityModal />
      </div>

      <CategorySection
        title="Academic / R&D"
        category="Academic"
        activities={allActivities}
        color="blue"
      />

      <hr className="border-slate-100" />

      <CategorySection
        title="Non-Academic"
        category="Non-Academic"
        activities={allActivities}
        color="emerald"
      />

      <hr className="border-slate-100" />

      <CategorySection
        title="Sponsorship"
        category="Sponsorship"
        activities={allActivities}
        color="amber"
      />

      {allActivities.length === 0 && (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 text-slate-500">
          No activities found. Run the seed script to populate the default activities.
        </div>
      )}
    </div>
  );
}
