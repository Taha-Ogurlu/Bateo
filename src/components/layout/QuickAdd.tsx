import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { uid } from "../../lib/id";
import { fromDateInputValue } from "../../lib/date";
import { useUI } from "../../store/ui";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Field, Input, Textarea } from "../ui/Field";
import { Select } from "../ui/Controls";
import { Tabs, TabsList, TabsTrigger } from "../ui/Tabs";
import { Icon } from "../icons";
import type { Priority } from "../../types";

export function QuickAdd() {
  const open = useUI((s) => s.quickAddOpen);
  const setOpen = useUI((s) => s.setQuickAddOpen);
  const [tab, setTab] = useState("note");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [due, setDue] = useState("");

  const folders = useLiveQuery(() => db.folders.toArray(), [], []);

  useEffect(() => {
    if (open) {
      setTitle("");
      setBody("");
      setDue("");
      setPriority("normal");
      setFolderId("");
    }
  }, [open]);

  const save = async () => {
    const now = Date.now();
    if (tab === "note") {
      if (!title.trim() && !body.trim()) return;
      await db.notes.add({
        id: uid("note"),
        title: title.trim() || "Başlıksız not",
        content: body,
        folderId: folderId || null,
        tags: [],
        pinned: false,
        favorite: false,
        archived: false,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      if (!title.trim()) return;
      await db.tasks.add({
        id: uid("task"),
        title: title.trim(),
        status: "todo",
        priority,
        dueDate: fromDateInputValue(due, "23:59"),
        courseId: null,
        tags: [],
        subtasks: [],
        createdAt: now,
        updatedAt: now,
      });
    }
    setOpen(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="Hızlı ekle"
      description="Aklına geleni hemen kaydet."
      footer={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            İptal
          </Button>
          <Button onClick={save} className="gap-2">
            <Icon name="check" size={16} /> Kaydet
          </Button>
        </>
      }
    >
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="w-full">
          <TabsTrigger value="note" className="flex-1 justify-center">
            <Icon name="note" size={15} /> Not
          </TabsTrigger>
          <TabsTrigger value="task" className="flex-1 justify-center">
            <Icon name="list-todo" size={15} /> Görev
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3">
        <Field label={tab === "note" ? "Not başlığı" : "Görev"}>
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={tab === "note" ? "Örn. Klasik koşullanma" : "Örn. Makale oku"}
          />
        </Field>

        {tab === "note" ? (
          <>
            <Field label="İçerik (isteğe bağlı)">
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Markdown destekler…" />
            </Field>
            <Field label="Klasör">
              <Select
                value={folderId}
                onValueChange={setFolderId}
                placeholder="Klasör seç (isteğe bağlı)"
                options={folders.map((f) => ({ value: f.id, label: f.name }))}
              />
            </Field>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Öncelik">
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Priority)}
                options={[
                  { value: "low", label: "Düşük" },
                  { value: "normal", label: "Normal" },
                  { value: "high", label: "Yüksek" },
                ]}
              />
            </Field>
            <Field label="Teslim tarihi">
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </Field>
          </div>
        )}
      </div>
    </Modal>
  );
}
