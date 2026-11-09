import { createElement, Fragment, useEffect, useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Dialog as PaperDialog, Modal, Portal, Snackbar } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNativeTheme } from "../theme/nativeTheme";
import { textChild } from "./basic.native";
import type { VoidCallback } from "./material.native";
import {
  EMPTY_OVERLAYS,
  hideSnackBar,
  overlaySnapshot,
  removeModal,
  removeSnack,
  subscribeOverlays,
  type ModalEntry,
  type SnackEntry,
} from "./overlayStore";

// Pop-up sur mobile (React Native Paper). Les fonctions show* et le store
// sont communs avec le web (overlayStore.ts).

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

/** Durée de l'animation de fermeture, avant de retirer le pop-up. */
const EXIT_DURATION = 300;

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
    Fragment,
    null,
    title !== undefined && createElement(PaperDialog.Title, null, textChild(title)),
    content !== undefined && createElement(PaperDialog.Content, null, textChild(content)),
    actions.length > 0 && createElement(PaperDialog.Actions, null, ...actions)
  );
}

/** Dialog de choix : un titre et une liste d'options (`SimpleDialogOption`). */
export function SimpleDialog({ title, children = [] }: { title?: ReactNode; children?: ReactNode[] }): ReactElement {
  return createElement(
    Fragment,
    null,
    title !== undefined && createElement(PaperDialog.Title, null, textChild(title)),
    createElement(View, { style: { paddingBottom: 8 } }, ...children)
  );
}

/** Une option de SimpleDialog. */
export function SimpleDialogOption({ onPressed, child }: { onPressed?: VoidCallback; child: ReactNode }): ReactElement {
  return createElement(
    Pressable,
    {
      onPress: onPressed ?? undefined,
      disabled: !onPressed,
      accessibilityRole: "button",
      style: ({ pressed }: { pressed: boolean }) => ({ paddingHorizontal: 24, paddingVertical: 12, opacity: pressed ? 0.6 : 1 }),
    },
    textChild(child)
  );
}

/** Dialog vide, au contenu libre. */
export function Dialog({ child }: { child?: ReactNode }): ReactElement {
  return createElement(View, null, textChild(child));
}

// --- Host -------------------------------------------------------------------

/** Affiche les pop-up ouverts. Monté une fois par MaterialApp. */
export function OverlayHost(): ReactElement {
  const { modals, snacks } = useSyncExternalStore(subscribeOverlays, overlaySnapshot, () => EMPTY_OVERLAYS);
  const snack = snacks[0];
  return createElement(
    Portal,
    null,
    ...modals.map((modal) => createElement(ModalView, { key: modal.id, modal })),
    snack && createElement(SnackView, { key: snack.id, snack })
  );
}

function ModalView({ modal }: { modal: ModalEntry }) {
  const colors = useNativeTheme().data.colorScheme;
  const insets = useSafeAreaInsets();

  // Fermé : on laisse l'animation se jouer, puis on retire le pop-up.
  useEffect(() => {
    if (modal.open) return;
    const timer = setTimeout(() => removeModal(modal.id), EXIT_DURATION);
    return () => clearTimeout(timer);
  }, [modal.open, modal.id]);

  const onDismiss = () => modal.close();

  if (modal.kind === "dialog") {
    return createElement(PaperDialog, {
      visible: modal.open,
      onDismiss,
      dismissable: modal.dismissible,
      style: { backgroundColor: colors.surface },
      children: modal.content,
    });
  }
  return createElement(
    Modal,
    {
      visible: modal.open,
      onDismiss,
      dismissable: modal.dismissible,
      // Panneau collé en bas de l'écran.
      style: { justifyContent: "flex-end", margin: 0 },
      contentContainerStyle: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: insets.bottom,
        maxHeight: "90%",
      },
      children: textChild(modal.content),
    }
  );
}

function SnackView({ snack }: { snack: SnackEntry }) {
  const { content, action, duration = 4000 } = snack.snackBar;

  useEffect(() => {
    if (snack.open) return;
    const timer = setTimeout(() => removeSnack(snack.id), EXIT_DURATION);
    return () => clearTimeout(timer);
  }, [snack.open, snack.id]);

  return createElement(
    Snackbar,
    {
      visible: snack.open,
      onDismiss: () => hideSnackBar(snack.id),
      duration,
      action: action && {
        label: action.label,
        onPress: () => {
          action.onPressed();
          hideSnackBar(snack.id);
        },
      },
      children: textChild(content),
    }
  );
}
