import { useRef, useState } from "react";
import { db } from "../../db/db";
import { wipeAllData } from "../../db/maintenance";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Icon } from "../../components/icons";
import type {
  Book,
  BookQuote,
  ClassSlot,
  Course,
  DayEntry,
  Deck,
  Exam,
  Flashcard,
  Folder,
  FocusSession,
  Note,
  Settings,
  Task,
} from "../../types";

type BackupRecord = { id: string };

export function BackupCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 3000);
  };

  const exportData = async () => {
    const data = {
      app: "BATEO",
      version: 1,
      exportedAt: new Date().toISOString(),
      notes: await db.notes.toArray(),
      folders: await db.folders.toArray(),
      tasks: await db.tasks.toArray(),
      courses: await db.courses.toArray(),
      classSlots: await db.classSlots.toArray(),
      focusSessions: await db.focusSessions.toArray(),
      exams: await db.exams.toArray(),
      dayEntries: await db.dayEntries.toArray(),
      decks: await db.decks.toArray(),
      flashcards: await db.flashcards.toArray(),
      books: await db.books.toArray(),
      bookQuotes: await db.bookQuotes.toArray(),
      settings: await db.settings.toArray(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bateo-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    flash("Yedek indirildi ✓");
  };

  const importData = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Yedek dosyası geçersiz.");
      const data = parsed as Record<string, unknown>;
      if (data.app !== "BATEO") throw new Error("Bu dosya BATEO yedeği değil.");
      const rows = <T extends BackupRecord>(key: string): T[] => {
        const value = data[key];
        if (value === undefined) return [];
        if (
          !Array.isArray(value) ||
          !value.every((row) => row !== null && typeof row === "object" && typeof (row as BackupRecord).id === "string")
        ) {
          throw new Error(`Yedek dosyasındaki "${key}" bölümü geçersiz.`);
        }
        return value as T[];
      };

      const notes = rows<Note>("notes");
      const folders = rows<Folder>("folders");
      const tasks = rows<Task>("tasks");
      const courses = rows<Course>("courses");
      const classSlots = rows<ClassSlot>("classSlots");
      const focusSessions = rows<FocusSession>("focusSessions");
      const exams = rows<Exam>("exams");
      const dayEntries = rows<DayEntry>("dayEntries");
      const decks = rows<Deck>("decks");
      const flashcards = rows<Flashcard>("flashcards");
      const books = rows<Book>("books");
      const bookQuotes = rows<BookQuote>("bookQuotes");
      const settings = rows<Settings>("settings");

      await db.transaction(
        "rw",
        [db.notes, db.folders, db.tasks, db.courses, db.classSlots, db.focusSessions, db.exams, db.dayEntries, db.decks, db.flashcards, db.books, db.bookQuotes, db.settings],
        async () => {
          if (notes.length) await db.notes.bulkPut(notes);
          if (folders.length) await db.folders.bulkPut(folders);
          if (tasks.length) await db.tasks.bulkPut(tasks);
          if (courses.length) await db.courses.bulkPut(courses);
          if (classSlots.length) await db.classSlots.bulkPut(classSlots);
          if (focusSessions.length) await db.focusSessions.bulkPut(focusSessions);
          if (exams.length) await db.exams.bulkPut(exams);
          if (dayEntries.length) await db.dayEntries.bulkPut(dayEntries);
          if (decks.length) await db.decks.bulkPut(decks);
          if (flashcards.length) await db.flashcards.bulkPut(flashcards);
          if (books.length) await db.books.bulkPut(books);
          if (bookQuotes.length) await db.bookQuotes.bulkPut(bookQuotes);
          if (settings.length) await db.settings.bulkPut(settings);
        },
      );
      flash("Yedek geri yüklendi; mevcut kayıtlarla birleştirildi ✓");
    } catch (error) {
      flash(error instanceof Error ? error.message : "Dosya okunamadı ✕");
    }
  };

  const wipe = async () => {
    try {
      const { cloudCleared, signedIn } = await wipeAllData();
      if (signedIn && cloudCleared) flash("Tüm veriler silindi (yerel + bulut)");
      else flash("Tüm veriler silindi");
    } catch (error) {
      flash(error instanceof Error ? error.message : "Veriler silinemedi; cihazdaki kayıtlar korundu.");
    }
  };

  return (
    <Card className="flex self-stretch flex-col">
      <CardHeader icon={<Icon name="download" size={18} />} title="Veri ve yedekleme" subtitle="Verilerini dışa aktar veya geri yükle" />
      <CardBody className="flex flex-1 flex-col justify-between gap-5">
        <div className="flex flex-wrap gap-2.5">
          <Button variant="soft" onClick={exportData} className="gap-2">
            <Icon name="download" size={17} /> Yedek al (JSON)
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
            <Icon name="upload" size={17} /> Yedeği geri yükle
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importData(file);
              event.target.value = "";
            }}
          />
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm("Tüm veriler silinecek (giriş yaptıysan buluttakiler de). Emin misin?")) void wipe();
            }}
            className="gap-2 text-danger hover:text-danger"
          >
            <Icon name="trash" size={17} /> Tüm verileri sil
          </Button>
        </div>
        <div className="rounded-xl border border-line bg-bg/30 p-3.5">
          <div className="flex items-start gap-2.5">
            <Icon name="info" size={16} className="mt-0.5 shrink-0 text-accent" />
            <div>
              <p className="text-xs font-semibold text-content">Verilerin tek dosyada güvende</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                Notların, görevlerin, programın, odak kayıtların ve tercihlerin yedeğe eklenir. Geri yükleme mevcut kayıtlarınla birleştirilir.
              </p>
            </div>
          </div>
        </div>
        {message && <p className="text-[13px] font-medium text-accent">{message}</p>}
      </CardBody>
    </Card>
  );
}
