"use client";
import { KVKK_DOC, LICENSES_DOC, type LegalBlock } from "../lib/legal-content";
import { Modal } from "./ui";

export type LegalKind = "kvkk" | "licenses";

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case "h":
      return <h3>{block.text}</h3>;
    case "p":
      return <p className={block.tone === "draft" ? "legal-draft" : undefined}>{block.text}</p>;
    case "list":
      return (
        <ul>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="legal-table-wrap">
          <table>
            <thead>
              <tr>
                {block.head.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => (
                    <td key={i} data-label={block.head[i]}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

/** The privacy notice (KVKK) or the licence list in the app's own dialog, in its theme (the HTML pages were white by night). */
export function LegalDialog({ kind, onClose }: { kind: LegalKind; onClose: () => void }) {
  const doc = kind === "kvkk" ? KVKK_DOC : LICENSES_DOC;
  return (
    <Modal title={doc.title} onClose={onClose} wide className="legal-dialog">
      <div className="legal-body">
        {doc.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>
    </Modal>
  );
}
