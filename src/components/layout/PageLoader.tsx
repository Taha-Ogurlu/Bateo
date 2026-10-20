import { BateoIcon } from "../brand/Bateo";

export function PageLoader() {
  return (
    <div className="grid h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative grid h-16 w-16 place-items-center">
          <BateoIcon size={64} className="absolute inset-0 opacity-40 blur-lg animate-float" />
          <BateoIcon size={64} className="relative" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Yükleniyor…
        </div>
      </div>
    </div>
  );
}
