"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { ReasoningUIPart } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Sparkles,
} from "lucide-react";
import { cn } from "lib/utils";
import { Markdown } from "./markdown";

interface ReasoningSectionProps {
  part: ReasoningUIPart;
  sectionKey: string;
  isStreaming: boolean;
}

const SpinnerIcon = memo(() => {
  return (
    <svg
      className="size-3 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
});
SpinnerIcon.displayName = "SpinnerIcon";

export const ReasoningSection = memo(function ReasoningSection({
  part,
  sectionKey,
  isStreaming,
}: ReasoningSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(isStreaming);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isComplete = part.state === "done";
  const reasoningText = part.text ?? "";

  const parallelTool = useMemo(() => {
    const metadata = part.providerMetadata as
      | Record<string, unknown>
      | undefined;
    if (!metadata) return null;
    return (
      (metadata as { parallelTool?: string }).parallelTool ??
      (metadata as { toolName?: string }).toolName ??
      null
    );
  }, [part.providerMetadata]);

  const hasContent = reasoningText.trim().length > 0;

  useEffect(() => {
    if (!isComplete && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isComplete, reasoningText]);

  useEffect(() => {
    if (!isStreaming && isExpanded) {
      setIsExpanded(false);
    }
  }, [isStreaming, isExpanded]);

  if (!hasContent) {
    return null;
  }

  return (
    <div className="my-2" data-section={sectionKey}>
      <div className="border border-border/80 rounded-xl overflow-hidden bg-card/80">
        <div
          className={cn(
            "flex items-center justify-between px-3 py-2 bg-background/80",
            isComplete && "cursor-pointer hover:bg-muted/60 transition-colors",
          )}
          onClick={() => {
            if (isComplete) {
              setIsExpanded((prev) => !prev);
            }
          }}
        >
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            {isStreaming ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-md border border-border/80 bg-muted/50 px-2 py-1">
                  <SpinnerIcon />
                  <span>Reasoning</span>
                  {parallelTool ? (
                    <span className="opacity-60">({parallelTool})</span>
                  ) : null}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Sparkles className="size-3" />
                <span>Reasoning</span>
                {parallelTool ? (
                  <span className="text-muted-foreground/70">
                    ({parallelTool})
                  </span>
                ) : null}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isComplete && (
              <span className="text-muted-foreground">
                {isExpanded ? (
                  <ChevronUp className="size-3" />
                ) : (
                  <ChevronDown className="size-3" />
                )}
              </span>
            )}
            {(isStreaming || isExpanded || isFullscreen) && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsFullscreen((prev) => !prev);
                  setIsExpanded(true);
                }}
                className="rounded p-1 text-muted-foreground hover:bg-muted transition-colors"
                aria-label={
                  isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                }
              >
                {isFullscreen ? (
                  <Minimize2 className="size-3" />
                ) : (
                  <Maximize2 className="size-3" />
                )}
              </button>
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {(!isComplete || isExpanded || isStreaming || isFullscreen) && (
            <motion.div
              key="reasoning-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="border-t border-border/60 bg-muted/20"
            >
              <div
                ref={scrollRef}
                className={cn(
                  "overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-border",
                  isFullscreen ? "max-h-[60vh]" : "max-h-[220px]",
                )}
              >
                <div className="px-3 py-3 text-xs leading-relaxed text-muted-foreground">
                  <Markdown>{reasoningText}</Markdown>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});
ReasoningSection.displayName = "ReasoningSection";
