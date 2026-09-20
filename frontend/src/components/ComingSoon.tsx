interface ComingSoonProps {
  label: string;
}

export function ComingSoon({ label }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white py-24 text-center">
      <p className="text-sm font-medium text-gray-700">{label} view</p>
      <p className="text-sm text-gray-400">This view isn&apos;t built yet — check back soon.</p>
    </div>
  );
}
