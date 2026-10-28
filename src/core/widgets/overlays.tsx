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
import {
  EMPTY_OVERLAYS,
  hideSnackBar,
  overlaySnapshot,
  removeModal,
  removeSnack,
  subscribeOverlays,
} from "./overlayStore";

// Pop-up sur le web (MUI). Les fonctions show* et le store sont dans
// overlayStore.ts, communs au web et au mobile.

export {
  showDialog,
  showModalBottomSheet,
  showSnackBar,
  SnackBar,
  SnackBarAction,
  type CloseOverlay,
  type ShowDialogOptions,
  type SnackBarConfig,
} from "./overlayStore";

// --- Dialogs ----------------------------------------------------------------

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

// --- Host -------------------------------------------------------------------

/** Affiche les pop-up ouverts. Monté une fois par MaterialApp. */
export function OverlayHost(): ReactElement {
  const { modals, snacks } = useSyncExternalStore(subscribeOverlays, overlaySnapshot, () => EMPTY_OVERLAYS);
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
