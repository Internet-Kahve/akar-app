/**
 * KVKK explicit-consent text shown with "İz Bırak". The version is sent with
 * every memory submission, so changing the text MUST change the version.
 * DRAFT: the aydınlatma metni is a placeholder until the legal text is approved.
 */
export const kvkkConsent = {
  textVersion: "taslak-2026-10-21",
  draftNotice:
    "Bu metin taslaktır; hukuki aydınlatma metni onaylandığında güncellenecek.",
  summary:
    "Anın ve eklediğin fotoğraf, moderasyon incelemesi ve yaşayan hafıza içeriğinin yayımlanması amacıyla işlenir. Onaylanan anılar herkese açık gösterilir.",
  checkbox:
    "Paylaştığım içeriğin bana ait olduğunu, aydınlatma metnini okuduğumu ve anımın ile fotoğrafımın bu amaçla işlenmesine, onaylanırsa yayımlanmasına açık rıza verdiğimi onaylıyorum.",
} as const;
