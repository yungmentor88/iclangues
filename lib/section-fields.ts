/**
 * Maps a page section's stored JSON onto friendly, labelled editor fields.
 *
 * Why this exists: seeded section content references text by KEY, not value —
 *   { "titleKeys": ["hero.title1", ...], "primaryCta": { "labelKey": "hero.cta1", "href": "/contact" } }
 * so editing the hero headline means editing the `hero.title1` row in
 * ui_strings. The owner must never see that. This module turns those keys
 * into fields labelled "Headline (line 1)", "Button text", and so on.
 *
 * Spec §5/§6: the editor exposes text, images and links — never raw HTML or
 * database keys. Structural arrays (cards, stats, marquee items) stay
 * developer-controlled: reordering or deleting them would alter the approved
 * layout, which §19/§23 forbid.
 */

export type FieldKind = "text" | "textarea" | "image" | "url";

export interface EditorField {
  /** Where the value lives. */
  source: "ui_string" | "section_json";
  kind: FieldKind;
  label: string;
  hint?: string;
  /** For source "ui_string": the ui_strings.key to edit. */
  stringKey?: string;
  /** For source "section_json": path into draft_content, e.g. ["slides","0","src"]. */
  path?: string[];
}

/** Human labels for the generic key names used across sections. */
const LABELS: Record<string, { label: string; kind: FieldKind; hint?: string }> = {
  eyebrowKey: { label: "Eyebrow", kind: "text", hint: "Small label above the heading" },
  headingKey: { label: "Heading", kind: "text" },
  subKey: { label: "Subheading", kind: "textarea" },
  introKey: { label: "Intro paragraph", kind: "textarea" },
  bodyKey: { label: "Body text", kind: "textarea" },
  textKey: { label: "Body text", kind: "textarea" },
  tagKey: { label: "Caption", kind: "text" },
  proofKey: { label: "Social proof line", kind: "text" },
  badgeKey: { label: "Badge text", kind: "text" },
  ctaKey: { label: "Button text", kind: "text" },
  ctaHref: { label: "Button link", kind: "url" },
  exploreKey: { label: "Card link text", kind: "text" },
  linkPreKey: { label: "Link intro text", kind: "text" },
  linkCtaKey: { label: "Link text", kind: "text" },
  linkHref: { label: "Link target", kind: "url" },
  emailKey: { label: "Email label", kind: "text" },
  phoneKey: { label: "Phone label", kind: "text" },
  whereKey: { label: "Location label", kind: "text" },
  whatsappMsgKey: { label: "WhatsApp message", kind: "text" },
  enrolLabel: { label: "Enrol button text", kind: "text" },
  emptyLabel: { label: "Empty results message", kind: "textarea" },
  filterAllLabel: { label: "Filter: All", kind: "text" },
  filterLevelLabel: { label: "Filter: Level", kind: "text" },
  filterLanguageLabel: { label: "Filter: Language", kind: "text" },
  heading: { label: "Heading", kind: "text" },
  image: { label: "Image", kind: "image" },
};

/** Multi-value key arrays and what to call each entry. */
const ARRAY_LABELS: Record<string, (i: number) => string> = {
  titleKeys: (i) => `Headline (line ${i + 1})`,
  lineKeys: (i) => `Line ${i + 1}`,
  featureKeys: (i) => `Feature ${i + 1}`,
  listKeys: (i) => `List item ${i + 1}`,
  itemKeys: (i) => `Item ${i + 1}`,
};

/** Fields we deliberately do not expose — changing them would alter layout. */
const STRUCTURAL = new Set(["cards", "stats", "items", "slides", "images"]);

function isI18nObject(v: unknown): v is Record<string, string> {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    typeof (v as Record<string, unknown>).en === "string"
  );
}

/**
 * Build the editable field list for one section.
 * `content` is the section's draft_content.
 */
export function describeSection(content: Record<string, unknown>): EditorField[] {
  const fields: EditorField[] = [];

  for (const [key, value] of Object.entries(content ?? {})) {
    // --- Arrays of string keys: titleKeys, lineKeys, featureKeys, ... ---
    if (key in ARRAY_LABELS && Array.isArray(value)) {
      value.forEach((k, i) => {
        if (typeof k === "string") {
          fields.push({
            source: "ui_string",
            kind: "text",
            label: ARRAY_LABELS[key](i),
            stringKey: k,
          });
        }
      });
      continue;
    }

    // --- Call-to-action objects: { labelKey, href } ---
    if ((key === "primaryCta" || key === "secondaryCta") && value && typeof value === "object") {
      const cta = value as { labelKey?: string; href?: string };
      const which = key === "primaryCta" ? "Primary" : "Secondary";
      if (cta.labelKey) {
        fields.push({
          source: "ui_string",
          kind: "text",
          label: `${which} button text`,
          stringKey: cta.labelKey,
        });
      }
      if (typeof cta.href === "string") {
        fields.push({
          source: "section_json",
          kind: "url",
          label: `${which} button link`,
          hint: "Start with / for a page on this site",
          path: [key, "href"],
        });
      }
      continue;
    }

    // --- An inline translated value stored on the section itself ---
    if (isI18nObject(value)) {
      const meta = LABELS[key];
      fields.push({
        source: "section_json",
        kind: meta?.kind ?? "text",
        label: meta?.label ?? key,
        hint: meta?.hint,
        path: [key],
      });
      continue;
    }

    if (STRUCTURAL.has(key)) continue;

    // --- Simple scalar: a string key, an image path or a link ---
    if (typeof value === "string") {
      const meta = LABELS[key];
      if (!meta) continue;

      // Keys ending in "Key" point at a ui_strings row.
      if (key.endsWith("Key")) {
        fields.push({
          source: "ui_string",
          kind: meta.kind,
          label: meta.label,
          hint: meta.hint,
          stringKey: value,
        });
      } else {
        fields.push({
          source: "section_json",
          kind: meta.kind,
          label: meta.label,
          hint: meta.hint,
          path: [key],
        });
      }
    }
  }

  return fields;
}

/** Every ui_strings key a section needs, for a single batched lookup. */
export function collectStringKeys(content: Record<string, unknown>): string[] {
  return describeSection(content)
    .filter((f) => f.source === "ui_string" && f.stringKey)
    .map((f) => f.stringKey as string);
}

/** Images a section renders, so the editor can offer to replace them. */
export function collectImages(content: Record<string, unknown>): { label: string; path: string[]; src: string }[] {
  const out: { label: string; path: string[]; src: string }[] = [];

  if (typeof content.image === "string") {
    out.push({ label: "Image", path: ["image"], src: content.image });
  }

  if (Array.isArray(content.images)) {
    content.images.forEach((src, i) => {
      if (typeof src === "string") out.push({ label: `Image ${i + 1}`, path: ["images", String(i)], src });
    });
  }

  if (Array.isArray(content.slides)) {
    content.slides.forEach((slide, i) => {
      if (slide && typeof slide === "object" && typeof (slide as { src?: string }).src === "string") {
        out.push({
          label: `Slide ${i + 1}`,
          path: ["slides", String(i), "src"],
          src: (slide as { src: string }).src,
        });
      }
    });
  }

  return out;
}
