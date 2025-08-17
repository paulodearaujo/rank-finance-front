"use client";

import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { cn } from "@/lib/utils";

interface ExpandableTextProps {
  text: string;
  lines?: number;
  className?: string;
  expandClassName?: string;
  buttonClassName?: string;
  showMoreText?: string;
  showLessText?: string;
}

export function ExpandableText({
  text,
  lines = 3,
  className,
  expandClassName,
  buttonClassName,
  showMoreText = "See more",
  showLessText = "See less",
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [shouldShowButton, setShouldShowButton] = React.useState(false);
  const textRef = React.useRef<HTMLParagraphElement>(null);

  // Check if text is long enough to need truncation
  React.useEffect(() => {
    const checkTruncation = () => {
      if (!textRef.current) return;

      const element = textRef.current;
      const computedStyle = window.getComputedStyle(element);

      // Create a temporary element to measure the full text height
      const tempDiv = document.createElement("p");
      tempDiv.style.cssText = `
        position: absolute;
        visibility: hidden;
        width: ${element.offsetWidth}px;
        font-size: ${computedStyle.fontSize};
        font-family: ${computedStyle.fontFamily};
        font-weight: ${computedStyle.fontWeight};
        line-height: ${computedStyle.lineHeight};
        letter-spacing: ${computedStyle.letterSpacing};
        padding: ${computedStyle.padding};
        white-space: pre-wrap;
        word-wrap: break-word;
      `;
      tempDiv.className = element.className;
      tempDiv.textContent = text;

      document.body.appendChild(tempDiv);

      // Calculate the max height for the specified number of lines
      const lineHeight =
        parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.5;
      const maxHeight = lineHeight * lines;

      // Check if full text height exceeds the max height
      const needsTruncation = tempDiv.scrollHeight > maxHeight;
      setShouldShowButton(needsTruncation);

      document.body.removeChild(tempDiv);
    };

    // Wait for browser to apply styles
    const timer = setTimeout(checkTruncation, 50);

    // Recheck on resize
    const handleResize = () => {
      clearTimeout(timer);
      setTimeout(checkTruncation, 50);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [text, lines]);

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            {/* Truncated text */}
            <p
              ref={textRef}
              className={cn(
                "text-sm leading-relaxed text-foreground/80",
                `line-clamp-${lines}`,
                className,
              )}
              style={{
                display: "-webkit-box",
                WebkitLineClamp: lines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                minHeight: `calc(${lines} * 1.5em)`,
              }}
            >
              {text}
            </p>

            {/* Action row reserved to keep consistent height */}
            <div className="mt-1 h-6 flex items-center justify-end">
              {shouldShowButton && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className={cn(
                    "text-sm font-medium text-foreground/60 hover:text-foreground",
                    "transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm",
                    "inline-flex items-center gap-1",
                    buttonClassName,
                  )}
                >
                  <span>{showMoreText}</span>
                  <svg
                    className="w-3 h-3 transition-transform duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Full text */}
            <p
              className={cn(
                "text-sm leading-relaxed text-foreground/80",
                expandClassName || className,
              )}
            >
              {text}
            </p>

            {/* See less button */}
            {shouldShowButton && (
              <button
                onClick={() => setIsExpanded(false)}
                className={cn(
                  "mt-1 text-sm font-medium text-foreground/60 hover:text-foreground",
                  "transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm",
                  "inline-flex items-center gap-1",
                  buttonClassName,
                )}
              >
                <span>{showLessText}</span>
                <svg
                  className="w-3 h-3 transition-transform duration-200 rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Variant with gradient fade effect (more Apple-like)
export function ExpandableTextWithGradient({
  text,
  lines = 3,
  className,
  expandClassName,
  buttonClassName,
  showMoreText = "More",
  showLessText = "Less",
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [shouldShowButton, setShouldShowButton] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);
  const textRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const checkTruncation = () => {
      if (!textRef.current) return;

      const element = textRef.current;
      const computedStyle = window.getComputedStyle(element);

      // Create a temporary element to measure the full text height
      const tempDiv = document.createElement("div");
      tempDiv.style.cssText = `
        position: absolute;
        visibility: hidden;
        width: ${element.offsetWidth}px;
        font-size: ${computedStyle.fontSize};
        font-family: ${computedStyle.fontFamily};
        font-weight: ${computedStyle.fontWeight};
        line-height: ${computedStyle.lineHeight};
        letter-spacing: ${computedStyle.letterSpacing};
        padding: ${computedStyle.padding};
        white-space: pre-wrap;
        word-wrap: break-word;
      `;
      tempDiv.className = element.className;
      tempDiv.textContent = text;

      document.body.appendChild(tempDiv);

      // Calculate the max height for the specified number of lines
      const lineHeight =
        parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.5;
      const maxHeight = lineHeight * lines;

      // Check if full text height exceeds the max height
      const needsTruncation = tempDiv.scrollHeight > maxHeight;
      setShouldShowButton(needsTruncation);

      document.body.removeChild(tempDiv);
    };

    // Wait for browser to apply styles
    const timer = setTimeout(checkTruncation, 50);

    // Recheck on resize
    const handleResize = () => {
      clearTimeout(timer);
      setTimeout(checkTruncation, 50);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [text, lines]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <motion.div
        animate={{
          height: isExpanded ? "auto" : `calc(${lines} * 1.5em + 1.5rem)`,
        }}
        transition={{
          duration: 0.4,
          ease: [0.25, 0.1, 0.25, 1], // Custom cubic-bezier for smoother animation
        }}
        className="relative overflow-hidden"
        style={{
          height: !isExpanded ? `calc(${lines} * 1.5em + 1.5rem)` : undefined, // content + reserved action row
          minHeight: `calc(${lines} * 1.5em + 1.5rem)`,
        }}
      >
        <div
          ref={textRef}
          className={cn(
            "text-sm leading-relaxed",
            isExpanded ? expandClassName || className : className,
          )}
          style={{
            color: "hsl(var(--foreground) / 0.85)",
            letterSpacing: "0.01em",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        >
          {text}
        </div>

        {/* Enhanced gradient overlay when collapsed */}
        <AnimatePresence>
          {!isExpanded && shouldShowButton && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-0 bottom-6 h-16 pointer-events-none"
              style={{
                background: `linear-gradient(to top,
                  hsl(var(--background)) 0%,
                  hsl(var(--background) / 0.95) 20%,
                  hsl(var(--background) / 0.8) 40%,
                  hsl(var(--background) / 0.4) 70%,
                  transparent 100%
                )`,
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Elegant toggle button inside a reserved action row */}
      <div className="mt-1 h-6 flex items-center justify-end">
        <AnimatePresence>
          {shouldShowButton && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, scale: isHovering ? 1.02 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, scale: { duration: 0.15 } }}
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "px-2 py-0.5",
                "text-[13px] font-medium",
                "text-foreground/60 hover:text-foreground/90",
                "bg-transparent hover:bg-foreground/5",
                "border border-transparent hover:border-foreground/10",
                "rounded-md",
                "transition-all duration-200 ease-out",
                "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-1",
                "inline-flex items-center gap-1",
                "select-none cursor-pointer",
                buttonClassName,
              )}
            >
              <span>{isExpanded ? showLessText : showMoreText}</span>
              <motion.svg
                animate={{ rotate: isExpanded ? 180 : 0, y: isExpanded ? -0.5 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </motion.svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Variant that accepts arbitrary React nodes instead of plain text,
// preserving the same gradient/expand behavior.
interface ExpandableRichTextProps {
  children?: React.ReactNode;
  lines?: number;
  className?: string;
  expandClassName?: string;
  buttonClassName?: string;
  showMoreText?: string;
  showLessText?: string;
}

export function ExpandableRichTextWithGradient({
  children,
  lines = 3,
  className,
  expandClassName,
  buttonClassName,
  showMoreText = "More",
  showLessText = "Less",
}: ExpandableRichTextProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [shouldShowButton, setShouldShowButton] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);
  const textRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const checkTruncation = () => {
      if (!textRef.current) return;
      const element = textRef.current;
      const computedStyle = window.getComputedStyle(element);
      const lineHeight =
        parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.5;
      const maxHeight = lineHeight * lines;
      const needsTruncation = element.scrollHeight > maxHeight;
      setShouldShowButton(needsTruncation);
    };

    const timer = setTimeout(checkTruncation, 50);
    const handleResize = () => {
      clearTimeout(timer);
      setTimeout(checkTruncation, 50);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [children, lines]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <motion.div
        animate={{ height: isExpanded ? "auto" : `calc(${lines} * 1.5em + 1.5rem)` }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative overflow-hidden"
        style={{
          height: !isExpanded ? `calc(${lines} * 1.5em + 1.5rem)` : undefined,
          minHeight: `calc(${lines} * 1.5em + 1.5rem)`,
        }}
      >
        <div
          ref={textRef}
          className={cn(
            "text-sm leading-relaxed",
            isExpanded ? expandClassName || className : className,
          )}
          style={{
            color: "hsl(var(--foreground) / 0.85)",
            letterSpacing: "0.01em",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            overflow: isExpanded ? undefined : "hidden",
          }}
        >
          {children}
        </div>

        <AnimatePresence>
          {!isExpanded && shouldShowButton && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-0 bottom-6 h-16 pointer-events-none"
              style={{
                background: `linear-gradient(to top,
                  hsl(var(--background)) 0%,
                  hsl(var(--background) / 0.95) 20%,
                  hsl(var(--background) / 0.8) 40%,
                  hsl(var(--background) / 0.4) 70%,
                  transparent 100%
                )`,
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      <div className="mt-1 h-6 flex items-center justify-end">
        <AnimatePresence>
          {shouldShowButton && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, scale: isHovering ? 1.02 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, scale: { duration: 0.15 } }}
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "px-2 py-0.5",
                "text-[13px] font-medium",
                "text-foreground/60 hover:text-foreground/90",
                "bg-transparent hover:bg-foreground/5",
                "border border-transparent hover:border-foreground/10",
                "rounded-md",
                "transition-all duration-200 ease-out",
                "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-1",
                "inline-flex items-center gap-1",
                "select-none cursor-pointer",
                buttonClassName,
              )}
            >
              <span>{isExpanded ? showLessText : showMoreText}</span>
              <motion.svg
                animate={{ rotate: isExpanded ? 180 : 0, y: isExpanded ? -0.5 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </motion.svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
