import type { ReactNode } from "react";

// Pop-up : dialogs, bottom sheets, snackbars. Comme en Flutter, ils s'ouvrent
// par une fonction (`showDialog`…) appelée depuis un callback, et non en
// plaçant un widget dans l'arbre. Ce store les garde ; <OverlayHost>, monté
// par MaterialApp, les affiche (MUI sur le web, Paper sur mobile).

/** Ferme le pop-up, en renvoyant éventuellement un résultat à `showDialog`. */
export type CloseOverlay<T> = (result?: T) => void;

export interface ModalEntry {
  id: number;
  kind: "dialog" | "sheet";
  content: ReactNode;
  open: boolean;
  dismissible: boolean;
  close: CloseOverlay<unknown>;
}

export interface SnackEntry {
  id: number;
  snackBar: SnackBarConfig;
  open: boolean;
}

export interface OverlayState {
  modals: ModalEntry[];
  snacks: SnackEntry[];
}

let state: OverlayState = { modals: [], snacks: [] };
let lastId = 0;
const listeners = new Set<() => void>();

function setOverlayState(update: (prev: OverlayState) => OverlayState) {
  state = update(state);
  listeners.forEach((listener) => listener());
}

export const subscribeOverlays = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

export const EMPTY_OVERLAYS: OverlayState = { modals: [], snacks: [] };

/** État courant des pop-up (pour useSyncExternalStore). */
export const overlaySnapshot = () => state;

function showModal<T>(
  kind: ModalEntry["kind"],
  builder: (close: CloseOverlay<T>) => ReactNode,
  dismissible: boolean
): Promise<T | undefined> {
  return new Promise((resolve) => {
    const id = ++lastId;
    let closed = false;
    const close: CloseOverlay<T> = (result) => {
      if (closed) return;
      closed = true;
      resolve(result);
      // Masqué d'abord ; retiré à la fin de l'animation (onExited).
      setOverlayState((prev) => ({
        ...prev,
        modals: prev.modals.map((m) => (m.id === id ? { ...m, open: false } : m)),
      }));
    };
    const entry: ModalEntry = {
      id,
      kind,
      content: builder(close),
      open: true,
      dismissible,
      close: close as CloseOverlay<unknown>,
    };
    setOverlayState((prev) => ({ ...prev, modals: [...prev.modals, entry] }));
  });
}

export const removeModal = (id: number) =>
  setOverlayState((prev) => ({ ...prev, modals: prev.modals.filter((m) => m.id !== id) }));

// --- Dialogs ----------------------------------------------------------------

export interface ShowDialogOptions<T> {
  /** Construit le contenu (AlertDialog, SimpleDialog, Dialog…). `close(result)` le ferme. */
  builder: (close: CloseOverlay<T>) => ReactNode;
  /** Clic à côté / touche Échap ferment le dialog. Par défaut `true`. */
  barrierDismissible?: boolean;
}

/**
 * Ouvre un dialog. La promesse renvoie la valeur passée à `close`,
 * ou `undefined` s'il a été fermé autrement :
 * ```ts
 * const ok = await showDialog<boolean>({
 *   builder: (close) => AlertDialog({
 *     title: Text("Supprimer ?"),
 *     actions: [
 *       TextButton({ onPressed: () => close(false), child: "Annuler" }),
 *       TextButton({ onPressed: () => close(true), child: "Supprimer" }),
 *     ],
 *   }),
 * });
 * ```
 */
export function showDialog<T = void>({
  builder,
  barrierDismissible = true,
}: ShowDialogOptions<T>): Promise<T | undefined> {
  return showModal("dialog", builder, barrierDismissible);
}

/**
 * Ouvre un panneau qui monte du bas de l'écran. Comme `showDialog`,
 * la promesse renvoie la valeur passée à `close`.
 */
export function showModalBottomSheet<T = void>({
  builder,
  isDismissible = true,
}: {
  builder: (close: CloseOverlay<T>) => ReactNode;
  /** Clic à côté / touche Échap ferment le panneau. Par défaut `true`. */
  isDismissible?: boolean;
}): Promise<T | undefined> {
  return showModal("sheet", builder, isDismissible);
}

// --- SnackBar ---------------------------------------------------------------

export interface SnackBarAction {
  label: string;
  onPressed: () => void;
}

/** Bouton d'action d'une SnackBar (« Annuler »…). */
export function SnackBarAction(action: SnackBarAction): SnackBarAction {
  return action;
}

export interface SnackBarConfig {
  content: ReactNode;
  action?: SnackBarAction;
  /** Durée d'affichage, en ms. Par défaut 4000. */
  duration?: number;
}

/** Description d'une SnackBar, à passer à `showSnackBar`. */
export function SnackBar(config: SnackBarConfig): SnackBarConfig {
  return config;
}

/**
 * Affiche un message temporaire en bas de l'écran. Les SnackBars s'affichent
 * l'une après l'autre. Renvoie une fonction qui la ferme.
 * ```ts
 * showSnackBar(SnackBar({ content: "Supprimé", action: SnackBarAction({ label: "Annuler", onPressed: undo }) }))
 * ```
 */
export function showSnackBar(snackBar: SnackBarConfig): () => void {
  const id = ++lastId;
  setOverlayState((prev) => ({ ...prev, snacks: [...prev.snacks, { id, snackBar, open: true }] }));
  return () => hideSnackBar(id);
}

export function hideSnackBar(id: number) {
  setOverlayState((prev) => ({
    ...prev,
    snacks: prev.snacks.map((s) => (s.id === id ? { ...s, open: false } : s)),
  }));
}

export const removeSnack = (id: number) =>
  setOverlayState((prev) => ({ ...prev, snacks: prev.snacks.filter((s) => s.id !== id) }));
