import type { PersonalRoute } from "@akar/domain";

/** Device routes mirror the API; the default always reads the legacy list. */
export function localRoutes(read: () => PersonalRoute[], legacy: () => string[], write: (routes: PersonalRoute[], ids: string[]) => void, published?: () => string[]) {
  const all = () => {
    const routes = structuredClone(read());
    const now = new Date().toISOString();
    if (!routes.some((route) => route.isDefault)) routes.unshift({ id: "default", name: "Rotam", isDefault: true, siteIds: legacy(), createdAt: now, updatedAt: now });
    return routes.map((route) => route.isDefault ? { ...route, siteIds: [...legacy()] } : route);
  };
  const nameOf = (name: string) => {
    const clean = name.trim();
    if (!clean || clean.length > 80) throw new Error("Invalid route name");
    return clean;
  };
  const save = (routes: PersonalRoute[]) => write(routes, routes.find((route) => route.isDefault)?.siteIds ?? []);
  const update = (id: string, change: (route: PersonalRoute) => PersonalRoute) => {
    const routes = all();
    const index = routes.findIndex((route) => route.id === id);
    if (index < 0) throw new Error("Route not found");
    routes[index] = { ...change(routes[index]!), updatedAt: new Date().toISOString() };
    save(routes);
    return structuredClone(routes[index]!);
  };
  return {
    async getPersonalRoutes() { return all(); },
    async createPersonalRoute(name: string) {
      const now = new Date().toISOString();
      const route: PersonalRoute = { id: crypto.randomUUID(), name: nameOf(name), isDefault: false, siteIds: [], createdAt: now, updatedAt: now };
      save([...all(), route]);
      return structuredClone(route);
    },
    async renamePersonalRoute(id: string, name: string) { return update(id, (route) => ({ ...route, name: nameOf(name) })); },
    async deletePersonalRoute(id: string) {
      const routes = all();
      if (!routes.some((route) => route.id === id)) throw new Error("Route not found");
      save(routes.filter((route) => route.id !== id));
    },
    async setPersonalRouteStops(id: string, siteIds: string[]) {
      if (siteIds.length > 100 || new Set(siteIds).size !== siteIds.length || siteIds.some((siteId) => !siteId || (published && !published().includes(siteId)))) throw new Error("Invalid route stops");
      return update(id, (route) => ({ ...route, siteIds: [...siteIds] }));
    },
  };
}
