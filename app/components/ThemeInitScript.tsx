"use client";

import { useServerInsertedHTML } from "next/navigation";
import { useRef } from "react";

// Apply the saved (or system) theme before paint to avoid a light-mode flash.
const themeInitScript = `try{var t=localStorage.getItem("gameon-theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}`;

export function ThemeInitScript() {
  const inserted = useRef(false);

  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return (
      <script
        dangerouslySetInnerHTML={{ __html: themeInitScript }}
      />
    );
  });

  return null;
}
