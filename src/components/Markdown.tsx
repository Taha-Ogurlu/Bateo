import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { cn } from "../lib/cn";

marked.setOptions({ gfm: true, breaks: true });

export function Markdown({ source, className }: { source: string; className?: string }) {
  const html = useMemo(() => {
    const raw = marked.parse(source ?? "") as string;
    return DOMPurify.sanitize(raw, { ADD_ATTR: ["target"] });
  }, [source]);

  return <div className={cn("markdown", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
