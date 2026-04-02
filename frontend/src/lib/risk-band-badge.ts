export function riskBandBadgeClass(band: string): string {
  switch (band) {
    case "A":
      return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300/80";
    case "B":
      return "bg-amber-100 text-amber-950 ring-1 ring-amber-300/80";
    case "C":
      return "bg-orange-100 text-orange-950 ring-1 ring-orange-300/80";
    default:
      return "bg-slate-100 text-slate-800 ring-1 ring-slate-300/80";
  }
}
