"use client";
import { useEffect, useState } from "react";
import type { AdminMember, AkarClient, MemberPage } from "@akar/api-client";
import type { Role } from "@akar/domain";
import { Modal, Notice, Tag } from "./ui";
import { describeError } from "../lib/errors";

const roles: Record<Role, { label: string; description: string }> = {
  user: {
    label: "Üye",
    description:
      "İçerikleri keşfeder ve katkıda bulunur. Yönetim paneline erişemez.",
  },
  editor: {
    label: "Editör",
    description: "Eserleri, rotaları ve görselleri düzenler.",
  },
  moderator: {
    label: "Moderatör",
    description: "Üye katkılarını ve bildirimlerini inceler.",
  },
  admin: {
    label: "Yönetici",
    description:
      "Tüm yönetim işlemlerini yapar; diğer üyelere yetki verebilir.",
  },
};
const date = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("tr-TR") : "Henüz giriş yapmadı";

export function AdminMembers({
  loadMembers,
  changeRole,
  currentUserId,
  live,
}: {
  loadMembers: AkarClient["getMembers"];
  changeRole: AkarClient["setMemberRole"];
  currentUserId: string;
  live: boolean;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({ query: "", page: 1, revision: 0 });
  const [data, setData] = useState<MemberPage | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<AdminMember | null>(null);
  const [role, setRole] = useState<Role>("user");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    setError("");
    setData(null);
    loadMembers(filter.query, filter.page)
      .then(
        (next) => {
          if (!cancelled) setData(next);
        },
        (reason) => {
          if (!cancelled)
            setError(describeError(reason, "Üyeler yüklenemedi."));
        },
      )
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, loadMembers]);
  const refresh = () =>
    setFilter((previous) => ({ ...previous, revision: previous.revision + 1 }));
  async function save() {
    if (!editing || saving || editing.role === role) return;
    setSaving(true);
    setSaveError("");
    try {
      const updated = await changeRole(editing.userId, role, editing.role);
      setMessage(
        `${updated.email ?? "Üye"} için rol ${roles[updated.role].label} olarak güncellendi.`,
      );
      setEditing(null);
      refresh();
    } catch (reason) {
      setSaveError(describeError(reason, "Rol güncellenemedi."));
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="admin-main admin-members" aria-busy={busy}>
      <div className="row between">
        <div>
          <small className="eyebrow">HESAP YÖNETİMİ</small>
          <h1>Üyeler ve roller</h1>
        </div>
        <button className="btn secondary" onClick={refresh} disabled={busy}>
          Yenile
        </button>
      </div>
      <p>
        Kayıtlı üyeleri bul, görevlerine uygun yetki ver veya yetkilerini
        kaldır. Yeni kayıtlar bu listede görünür.
      </p>
      {!live && (
        <Notice>
          Örnek üyeler gösteriliyor. Bu ekrandaki demo rol değişiklikleri sayfa
          yenilendiğinde sıfırlanır.
        </Notice>
      )}
      <details className="member-role-guide">
        <summary>Roller hangi yetkileri verir?</summary>
        <dl>
          {Object.entries(roles).map(([key, value]) => (
            <div key={key}>
              <dt>{value.label}</dt>
              <dd>{value.description}</dd>
            </div>
          ))}
        </dl>
      </details>
      <form
        className="member-search"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage("");
          setFilter((previous) => ({
            query: search.trim(),
            page: 1,
            revision: previous.revision + 1,
          }));
        }}
      >
        <label htmlFor="member-search">E-posta ile üye ara</label>
        <div className="row">
          <input
            id="member-search"
            className="admin-search"
            type="search"
            maxLength={254}
            placeholder="ornek@eposta.com"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className="btn" type="submit" disabled={busy}>
            Ara
          </button>
        </div>
      </form>
      {message && <p role="status">{message}</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button className="btn secondary" onClick={refresh}>
            Tekrar dene
          </button>
        </div>
      )}
      {busy && <p role="status">Üyeler yükleniyor…</p>}
      {data && (
        <>
          {data.items.length === 0 ? (
            <Notice>
              {filter.query
                ? "Aramana uygun üye bulunamadı."
                : "Bu sayfada üye bulunamadı."}
            </Notice>
          ) : (
            <div className="table-wrap">
              <table>
                <caption className="sr-only">
                  Kayıtlı üyeler ve yetkileri
                </caption>
                <thead>
                  <tr>
                    <th>Üye</th>
                    <th>Rol</th>
                    <th>Kayıt / son giriş</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((member) => (
                    <tr key={member.userId}>
                      <td>
                        <strong>
                          {member.displayName || "Ad belirtilmemiş"}
                        </strong>
                        <span className="member-email">
                          {member.email ?? "E-posta yok"}
                        </span>
                        {member.userId === currentUserId && <Tag>Sen</Tag>}
                        {!member.emailConfirmed && (
                          <Tag>E-posta doğrulanmamış</Tag>
                        )}
                      </td>
                      <td>
                        <Tag
                          tone={member.role === "admin" ? "success" : "muted"}
                        >
                          {roles[member.role].label}
                        </Tag>
                      </td>
                      <td>
                        {date(member.createdAt)}
                        <span className="member-email">
                          {date(member.lastSignInAt)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn secondary"
                          disabled={
                            member.userId === currentUserId ||
                            (!member.emailConfirmed && member.role === "user")
                          }
                          aria-label={`${member.email ?? "Üye"} için rolü düzenle`}
                          onClick={() => {
                            setEditing(member);
                            setRole(member.role);
                            setSaveError("");
                            setMessage("");
                          }}
                        >
                          Rolü düzenle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <nav
            className="row between member-pagination"
            aria-label="Üye sayfaları"
          >
            <button
              className="btn secondary"
              disabled={filter.page === 1 || busy}
              onClick={() =>
                setFilter((previous) => ({
                  ...previous,
                  page: previous.page - 1,
                }))
              }
            >
              Önceki
            </button>
            <span>Sayfa {data.page}</span>
            <button
              className="btn secondary"
              disabled={!data.nextPage || busy}
              onClick={() =>
                setFilter((previous) => ({ ...previous, page: data.nextPage! }))
              }
            >
              Sonraki
            </button>
          </nav>
        </>
      )}
      <p className="member-help">
        Kendi rolünü değiştiremezsin. E-posta adresi doğrulanmadan yetki
        verilemez. Sistemde en az bir yönetici kalır.
      </p>
      {editing && (
        <Modal
          title="Üye rolünü değiştir"
          dismissible={!saving}
          onClose={() => {
            if (!saving) {
              setEditing(null);
              refresh();
            }
          }}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <p>
              <strong>{editing.email ?? editing.displayName ?? "Üye"}</strong>
            </p>
            <p>Mevcut rol: {roles[editing.role].label}</p>
            <label className="member-role-select">
              Yeni rol
              <select
                value={role}
                disabled={saving}
                onChange={(event) => setRole(event.target.value as Role)}
              >
                {Object.entries(roles).map(([key, value]) => (
                  <option
                    key={key}
                    value={key}
                    disabled={key !== "user" && !editing.emailConfirmed}
                  >
                    {value.label}
                  </option>
                ))}
              </select>
            </label>
            <Notice>{roles[role].description}</Notice>
            {role !== editing.role && (
              <p>
                {role === "admin"
                  ? "Bu üye diğer üyeleri yönetebilecek ve yönetici atayabilecek."
                  : role === "user"
                    ? "Üyenin yönetim paneli erişimi kaldırılacak; hesabı ve katkıları korunacak."
                    : "Yeni yetkiler bir sonraki istekte geçerli olacak."}{" "}
                Değişiklik işlem geçmişine kaydedilir.
              </p>
            )}
            {saveError && <p role="alert">{saveError}</p>}
            <div className="row between">
              <button
                type="button"
                className="btn secondary"
                disabled={saving}
                onClick={() => {
                  setEditing(null);
                  refresh();
                }}
              >
                Vazgeç
              </button>
              <button
                className="btn"
                type="submit"
                disabled={saving || role === editing.role}
              >
                {saving ? "Kaydediliyor…" : "Değişikliği onayla"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
