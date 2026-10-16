"use client";
import {
  ArrowRight,
  Landmark,
  Store,
  Wrench,
  Sun,
  Users,
  Maximize2,
} from "lucide-react";
import type { HeritageSite } from "@akar/domain";
export function Architecture({ kind = "cami" }: { kind?: string }) {
  return (
    <div className={`architecture ${kind}`} aria-hidden="true">
      <div className="arch-ground" />
      <div className="minaret">
        <i />
        <b />
        <span />
      </div>
      <div className="main-building">
        <div className="dome">
          <i />
        </div>
        <div className="building-wall">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="portico">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className="side-building">
        <i />
        <span />
        <span />
      </div>
      <div className="tree tree-one" />
      <div className="tree tree-two" />
    </div>
  );
}
export function Scene({
  site,
  flow = false,
  onHotspot,
}: {
  site: HeritageSite;
  flow?: boolean;
  onHotspot: (id: string) => void;
}) {
  return (
    <div className={`scene ${flow ? "flow-scene" : ""}`}>
      <div className="scene-top">
        <span className="tag">ETKİLEŞİMLİ KEŞİF</span>
        <span className="tag representative">
          Temsili görünüm · 3D henüz bağlanmadı
        </span>
      </div>
      {flow ? (
        <div className="flow">
          <div className="flow-node">
            <Store size={36} />
            <h3>Bedesten</h3>
            <span>Akar · gelir sağlayan</span>
          </div>
          <div className="flow-connector">
            <span>Vakıf geliri</span>
            <ArrowRight size={48} />
          </div>
          <div className="flow-node">
            <Landmark size={36} />
            <h3>Ulucami</h3>
            <span>Hayrat · hizmet sunan</span>
          </div>
          <div className="flow-uses">
            <span>
              <Wrench size={18} />
              Bakım
            </span>
            <span>
              <Sun size={18} />
              Aydınlatma
            </span>
            <span>
              <Users size={18} />
              Görevliler
            </span>
          </div>
          <p>
            Bedesten → Ulucami demo anlatımıdır.
            <br />
            Bu esere ait gelir ilişkileri kaynak doğrulaması bekliyor.
          </p>
        </div>
      ) : (
        <>
          <Architecture kind={site.kind} />
          <button
            className="hotspot dome-spot"
            onClick={() => onHotspot("kubbe")}
          >
            <span>1</span>Kubbenin hikâyesi
          </button>
          <button
            className="hotspot courtyard-spot"
            onClick={() => onHotspot("avlu")}
          >
            <span>2</span>Avluya yakından bak
          </button>
          <button
            className="hotspot bath-spot"
            onClick={() => onHotspot("akar")}
          >
            <span>3</span>Vakıf nasıl yaşar?
          </button>
        </>
      )}
      <div className="scene-bottom">
        <div>
          <small>BİR YAPI, BİNLERCE HİKÂYE</small>
          <h2>{site.name}</h2>
        </div>
        <span>
          <Maximize2 size={16} />{" "}
          {flow ? "Akar → Hayrat" : "Bir noktaya dokun, keşfet"}
        </span>
      </div>
    </div>
  );
}
