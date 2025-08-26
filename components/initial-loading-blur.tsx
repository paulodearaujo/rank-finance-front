"use client";

import { useEffect } from "react";

/**
 * Initial loading blur that shows immediately and removes when content is ready
 * This component manages the blur overlay defined in the layout
 */
export function InitialLoadingBlur() {
  useEffect(() => {
    const removeBlur = () => {
      const blur = document.getElementById("initial-loading-blur");
      if (!blur) return;

      blur.style.opacity = "0";
      // Remove from DOM after transition
      setTimeout(() => {
        blur.remove();
      }, 300);
    };

    /**
     * Wait for critical content to be visible in viewport
     * This ensures not just loaded, but actually painted
     */
    const waitForContent = () => {
      // Check if main content container exists and has content
      const mainContent = document.getElementById("rank-tracker-content");
      const header = document.getElementById("rank-tracker-header");

      if (!mainContent || !header) {
        // If containers don't exist, wait a bit more
        requestAnimationFrame(waitForContent);
        return;
      }

      // Check if containers have actual painted content
      const mainRect = mainContent.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();

      // Verify elements have dimensions (are painted)
      const isMainPainted = mainRect.height > 0 && mainRect.width > 0;
      const isHeaderPainted = headerRect.height > 0 && headerRect.width > 0;

      // Check if there's actual content (not just empty containers)
      const hasCards =
        mainContent.querySelector(".grid") || mainContent.querySelector("[id*='empty-state']");

      if (isMainPainted && isHeaderPainted && hasCards) {
        // Content is painted, safe to remove blur
        // Use double RAF to ensure next paint cycle
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            removeBlur();
          });
        });
      } else {
        // Content not ready, check again next frame
        requestAnimationFrame(waitForContent);
      }
    };

    // Start checking after hydration
    // Small delay to ensure React hydration started
    const startTimeout = setTimeout(() => {
      waitForContent();
    }, 10);

    // Fallback: Remove blur after max wait time (3 seconds)
    const fallbackTimeout = setTimeout(() => {
      console.warn("Initial blur: Fallback removal after 3s");
      removeBlur();
    }, 3000);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(fallbackTimeout);
    };
  }, []);

  return null;
}
