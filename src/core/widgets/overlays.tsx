"use client";

import { createElement, useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import MuiButton from "@mui/material/Button";
import MuiDialog from "@mui/material/Dialog";
import MuiDialogActions from "@mui/material/DialogActions";
import MuiDialogContent from "@mui/material/DialogContent";
import MuiDialogTitle from "@mui/material/DialogTitle";
import MuiDrawer from "@mui/material/Drawer";
import MuiListItemButton from "@mui/material/ListItemButton";
import MuiSnackbar from "@mui/material/Snackbar";
import type { VoidCallback } from "./material";

// Pop-up : dialogs, bottom sheets, snackbars. Comme en Flutter, ils s'ouvrent
// par une fonction (`showDialog`…) appelée depuis un callback, et non en
// plaçant un widget dans l'arbre. Un store global les garde ; <OverlayHost>,
// monté par MaterialApp, les affiche.

/** Ferme le pop-up, en renvoyant éventuellement un résultat à `showDialog`. */
export type CloseOverlay<T> = (result?: T) => void;

interface ModalEntry {
  id: number;
  kind: "dialog" | "sheet";
  content: ReactNode;
  open: boolean;
  dismissible: boolean;
  close: CloseOverlay<unknown>;
}

interface SnackEntry {
  id: number;
  snackBar: SnackBarConfig;
  open: boolean;
}

interface OverlayState {
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

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

const EMPTY: OverlayState = { modals: [], snacks: [] };

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

const removeModal = (id: number) =>
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

/** Dialog d'alerte : titre, contenu et boutons d'action en bas à droite. */
export function AlertDialog({
  title,
  content,
  actions = [],
}: {
  title?: ReactNode;
  content?: ReactNode;
  actions?: ReactNode[];
}): ReactElement {
  return createElement(
    "div",
    null,
    title !== undefined && createElement(MuiDialogTitle, null, title),
    content !== undefined && createElement(MuiDialogContent, null, content),
    actions.length > 0 && createElement(MuiDialogActions, null, ...actions)
  );
}

/** Dialog de choix : un titre et une liste d'options (`SimpleDialogOption`). */
export function SimpleDialog({
  title,
  children = [],
}: {
  title?: ReactNode;
  children?: ReactNode[];
}): ReactElement {
  return createElement(
    "div",
    { style: { paddingBottom: 8 } },
    title !== undefined && createElement(MuiDialogTitle, null, title),
    ...children
  );
}

/** Une option de SimpleDialog. */
export function SimpleDialogOption({
  onPressed,
  child,
}: {
  onPressed?: VoidCallback;
  child: ReactNode;
}): ReactElement {
  return createElement(
    MuiListItemButton,
    { disabled: !onPressed, onClick: onPressed ?? undefined, sx: { px: 3 } },
    child
  );
}

/** Dialog vide, au contenu libre. */
export function Dialog({ child }: { child?: ReactNode }): ReactElement {
  return createElement("div", null, child);
}

// --- Bottom sheet -----------------------------------------------------------

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

function hideSnackBar(id: number) {
  setOverlayState((prev) => ({
    ...prev,
    snacks: prev.snacks.map((s) => (s.id === id ? { ...s, open: false } : s)),
  }));
}

const removeSnack = (id: number) =>
  setOverlayState((prev) => ({ ...prev, snacks: prev.snacks.filter((s) => s.id !== id) }));

// --- Host -------------------------------------------------------------------

/** Affiche les pop-up ouverts. Monté une fois par MaterialApp. */
export function OverlayHost(): ReactElement {
  const { modals, snacks } = useSyncExternalStore(subscribe, () => state, () => EMPTY);
  const snack = snacks[0];

  return createElement(
    "div",
    null,
    ...modals.map((modal) => {
      const onClose = modal.dismissible ? () => modal.close() : undefined;
      const onExited = () => removeModal(modal.id);
      return modal.kind === "dialog"
        ? createElement(
            MuiDialog,
            { key: modal.id, open: modal.open, onClose, slotProps: { transition: { onExited } } },
            modal.content
          )
        : createElement(
            MuiDrawer,
            {
              key: modal.id,
              anchor: "bottom",
              open: modal.open,
              onClose,
              slotProps: {
                transition: { onExited },
                paper: { sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "90dvh" } },
              },
            },
            modal.content
          );
    }),
    snack &&
      createElement(MuiSnackbar, {
        key: snack.id,
        open: snack.open,
        message: snack.snackBar.content,
        autoHideDuration: snack.snackBar.duration ?? 4000,
        onClose: (_event: unknown, reason?: string) => {
          if (reason !== "clickaway") hideSnackBar(snack.id);
        },
        slotProps: { transition: { onExited: () => removeSnack(snack.id) } },
        action:
          snack.snackBar.action &&
          createElement(
            MuiButton,
            {
              color: "inherit",
              size: "small",
              onClick: () => {
                snack.snackBar.action!.onPressed();
                hideSnackBar(snack.id);
              },
            },
            snack.snackBar.action.label
          ),
      })
  );
}
