import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { useLiveQuery } from "dexie-react-hooks";
import { db, updateSettings } from "../../db/db";
import { Button } from "../ui/Button";
import { Input, Field } from "../ui/Field";
import { Slider } from "../ui/Controls";
import { Icon } from "../icons";

const EASE = [0.22, 1, 0.36, 1] as const;

/** İlk girişten sonra: isim + hedefler (2 adım) */
export function Onboarding() {
  // Ayarlar yüklenene kadar GÖSTERME (varsayılanlarla flash yapmasın)
  const row = useLiveQuery(() => db.settings.get("app"), []);
  const open = !!row && row.onboarded === false;

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [daily, setDaily] = useState(120);
  const [weekly, setWeekly] = useState(600);

  const finish = async () => {
    await updateSettings({
      onboarded: true,
      userName: name.trim(),
      dailyGoalMinutes: daily,
      weeklyGoalMinutes: weekly,
    });
  };

  const skip = () => void updateSettings({ onboarded: true });

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) skip();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[70] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-line bg-elevated shadow-[var(--shadow)] outline-none">
          <Dialog.Title className="sr-only">Profil kurulumu</Dialog.Title>
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-32 accent-gradient opacity-20 blur-3xl -z-0" />
            <div className="relative z-10 px-7 pt-8 pb-6">
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div
                    key="s0"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.26, ease: EASE }}
                  >
                    <h2 className="text-xl font-bold text-content">Sana nasıl hitap edelim?</h2>
                    <p className="mt-1.5 text-sm text-muted">İsteğe bağlı — sonradan değiştirebilirsin.</p>
                    <div className="mt-5">
                      <Field label="Adın">
                        <Input
                          autoFocus
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Örn. Ayşe"
                          onKeyDown={(e) => e.key === "Enter" && setStep(1)}
                        />
                      </Field>
                    </div>
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div
                    key="s1"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.26, ease: EASE }}
                  >
                    <h2 className="text-xl font-bold text-content">Hedeflerini belirleyelim</h2>
                    <p className="mt-1.5 text-sm text-muted">Kendine uygun bir çalışma hedefi seç.</p>
                    <div className="mt-6 flex flex-col gap-6">
                      <div>
                        <div className="mb-2 flex items-baseline justify-between">
                          <span className="text-sm font-medium text-content">Günlük çalışma hedefi</span>
                          <span className="text-sm font-semibold text-accent">{daily} dk</span>
                        </div>
                        <Slider value={daily} onValueChange={setDaily} min={30} max={360} step={15} />
                      </div>
                      <div>
                        <div className="mb-2 flex items-baseline justify-between">
                          <span className="text-sm font-medium text-content">Haftalık hedef</span>
                          <span className="text-sm font-semibold text-accent">{Math.round(weekly / 60)} saat</span>
                        </div>
                        <Slider value={weekly} onValueChange={setWeekly} min={120} max={2400} step={60} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative z-10 flex items-center justify-between gap-3 border-t border-line px-7 py-4">
              <div className="flex items-center gap-1.5">
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: i === step ? 22 : 8,
                      background: i === step ? "var(--accent)" : "var(--line)",
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={skip}>
                  Şimdi değil
                </Button>
                {step > 0 && (
                  <Button variant="ghost" onClick={() => setStep(0)}>
                    Geri
                  </Button>
                )}
                {step === 0 ? (
                  <Button onClick={() => setStep(1)} className="gap-2">
                    İleri <Icon name="chevron-right" size={16} />
                  </Button>
                ) : (
                  <Button onClick={finish} className="gap-2">
                    <Icon name="check" size={16} /> Başlayalım
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
