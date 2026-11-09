import { createElement, useState, type ReactElement, type ReactNode } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { HelperText as PaperHelperText, Menu as PaperMenu, TextInput as PaperTextInput } from "react-native-paper";
import { useNativeTheme } from "../theme/nativeTheme";
import { DefaultTextStyleScope, Icon, Text, textChild } from "./basic.native";
import type * as Web from "./material";

// Widgets Material sur mobile : boutons, et champs / listes déroulantes
// rendus par React Native Paper (thème synchronisé dans ThemeProvider).

export type VoidCallback = (() => void) | null | undefined;

// --- Boutons ----------------------------------------------------------------

type Variant = "contained" | "text" | "outlined";

interface ButtonViewProps {
  variant: Variant;
  onPressed?: VoidCallback;
  icon?: ReactNode;
  label: ReactNode;
}

function ButtonView({ variant, onPressed, icon, label }: ButtonViewProps) {
  const colors = useNativeTheme().data.colorScheme;
  const enabled = !!onPressed;
  const foreground = variant === "contained" ? colors.onPrimary : colors.primary;
  const style: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 40,
    paddingHorizontal: variant === "text" ? 12 : 24,
    borderRadius: 20,
    alignSelf: "flex-start",
    ...(variant === "contained" && { backgroundColor: enabled ? colors.primary : colors.surfaceContainer }),
    ...(variant === "outlined" && { borderWidth: 1, borderColor: colors.outline }),
  };
  return createElement(
    Pressable,
    {
      onPress: onPressed ?? undefined,
      disabled: !enabled,
      accessibilityRole: "button",
      style: ({ pressed }: { pressed: boolean }) => [style, { opacity: !enabled ? 0.5 : pressed ? 0.8 : 1 }],
    },
    createElement(
      DefaultTextStyleScope,
      { style: { color: enabled ? foreground : colors.onSurfaceVariant, fontWeight: 500 } },
      icon,
      textChild(label)
    )
  );
}

function makeButton(variant: Variant) {
  function button({ onPressed, child }: { onPressed?: VoidCallback; child: ReactNode }): ReactElement {
    return createElement(ButtonView, { variant, onPressed, label: child });
  }
  button.icon = ({ onPressed, icon, label }: { onPressed?: VoidCallback; icon: ReactNode; label: ReactNode }): ReactElement =>
    createElement(ButtonView, { variant, onPressed, icon, label });
  return button;
}

export const ElevatedButton = makeButton("contained");
export const TextButton = makeButton("text");
export const OutlinedButton = makeButton("outlined");

/** Bouton icône. `tooltip` sert de libellé d'accessibilité. */
export function IconButton(props: { icon: ReactNode; onPressed?: VoidCallback; tooltip?: string; color?: string }): ReactElement {
  return createElement(IconButtonView, props);
}

function IconButtonView({ icon, onPressed, tooltip, color }: { icon: ReactNode; onPressed?: VoidCallback; tooltip?: string; color?: string }) {
  const enabled = !!onPressed;
  return createElement(
    Pressable,
    {
      onPress: onPressed ?? undefined,
      disabled: !enabled,
      accessibilityRole: "button",
      accessibilityLabel: tooltip,
      hitSlop: 4,
      style: ({ pressed }: { pressed: boolean }): ViewStyle => ({
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        opacity: !enabled ? 0.4 : pressed ? 0.6 : 1,
      }),
    },
    color ? createElement(DefaultTextStyleScope, { style: { color } }, icon) : icon
  );
}

/** Bouton rond flottant (placé en bas à droite par Scaffold). */
export function FloatingActionButton(props: { onPressed?: VoidCallback; child: ReactNode; tooltip?: string }): ReactElement {
  return createElement(FabView, { ...props, label: undefined });
}

FloatingActionButton.extended = (props: { onPressed?: VoidCallback; icon?: ReactNode; label: ReactNode }): ReactElement =>
  createElement(FabView, { onPressed: props.onPressed, child: props.icon, label: props.label });

function FabView({ onPressed, child, label, tooltip }: { onPressed?: VoidCallback; child?: ReactNode; label?: ReactNode; tooltip?: string }) {
  const colors = useNativeTheme().data.colorScheme;
  return createElement(
    Pressable,
    {
      onPress: onPressed ?? undefined,
      disabled: !onPressed,
      accessibilityRole: "button",
      accessibilityLabel: tooltip,
      style: ({ pressed }: { pressed: boolean }): ViewStyle => ({
        minWidth: 56,
        height: 56,
        borderRadius: 16,
        paddingHorizontal: label ? 16 : 0,
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primary,
        opacity: pressed ? 0.85 : 1,
        boxShadow: [{ offsetX: 0, offsetY: 3, blurRadius: 6, color: "rgba(0,0,0,0.3)" }],
      }),
    },
    createElement(DefaultTextStyleScope, { style: { color: colors.onPrimary, fontWeight: 500 } }, child, label && textChild(label))
  );
}

// --- TextField --------------------------------------------------------------

export const TextInputType = {
  text: "text",
  emailAddress: "email",
  number: "number",
  phone: "tel",
  url: "url",
  multiline: "multiline",
} as const;
export type TextInputType = (typeof TextInputType)[keyof typeof TextInputType];

export type InputDecoration = Web.InputDecoration;
export function InputDecoration(decoration: InputDecoration): InputDecoration {
  return decoration;
}

export type TextFieldProps = Web.TextFieldProps;

const KEYBOARD = {
  text: "default",
  email: "email-address",
  number: "numeric",
  tel: "phone-pad",
  url: "url",
  multiline: "default",
} as const;

/** Champ de saisie (React Native Paper) : `TextField({ value, onChanged, decoration: InputDecoration({ labelText: "Nom" }) })`. */
export function TextField(props: TextFieldProps = {}): ReactElement {
  return createElement(TextFieldView, props);
}

function TextFieldView({
  value,
  initialValue,
  onChanged,
  onSubmitted,
  decoration = {},
  keyboardType = "text",
  obscureText = false,
  maxLines,
  enabled = true,
  autofocus,
}: TextFieldProps) {
  const multiline = keyboardType === "multiline" || (maxLines !== undefined && maxLines > 1);
  // Icône : rendue telle quelle (un IconButton reste cliquable).
  const adornment = (node: ReactNode) => node && createElement(PaperTextInput.Icon, { icon: () => node });
  const helper = decoration.errorText ?? decoration.helperText;
  return createElement(
    View,
    null,
    createElement(PaperTextInput, {
      value,
      defaultValue: initialValue,
      onChangeText: onChanged,
      onSubmitEditing: (event: { nativeEvent: { text: string } }) => onSubmitted?.(event.nativeEvent.text),
      label: decoration.labelText,
      placeholder: decoration.hintText,
      error: decoration.errorText !== undefined,
      mode: decoration.border === "underline" || decoration.border === "filled" ? "flat" : "outlined",
      keyboardType: KEYBOARD[keyboardType],
      autoCapitalize: keyboardType === "text" || keyboardType === "multiline" ? "sentences" : "none",
      secureTextEntry: obscureText,
      multiline,
      numberOfLines: multiline ? maxLines : undefined,
      editable: enabled,
      disabled: !enabled,
      autoFocus: autofocus,
      left: adornment(decoration.prefixIcon),
      right: adornment(decoration.suffixIcon),
    }),
    helper !== undefined &&
      createElement(PaperHelperText, {
        type: decoration.errorText !== undefined ? "error" : "info",
        visible: true,
        children: helper,
      })
  );
}

// --- DropdownButton ---------------------------------------------------------

export type DropdownMenuItem<T> = Web.DropdownMenuItem<T>;
export function DropdownMenuItem<T>(item: DropdownMenuItem<T>): DropdownMenuItem<T> {
  return item;
}

export type DropdownButtonProps<T> = Web.DropdownButtonProps<T>;

/** Liste déroulante : un menu (React Native Paper) s'ouvre sous le champ. */
export function DropdownButton<T>(props: DropdownButtonProps<T>): ReactElement {
  return createElement(DropdownButtonView as (p: DropdownButtonProps<T>) => ReactElement, props);
}

function DropdownButtonView<T>({ value, items, onChanged, hint, labelText, isExpanded = false }: DropdownButtonProps<T>) {
  const colors = useNativeTheme().data.colorScheme;
  const [open, setOpen] = useState(false);
  const selected = items.find((item) => item.value === value);
  const enabled = !!onChanged;

  const anchor = createElement(
    Pressable,
    {
      onPress: () => setOpen(true),
      disabled: !enabled,
      accessibilityRole: "button",
      accessibilityLabel: labelText,
      style: {
        minHeight: 56,
        minWidth: 160,
        alignSelf: isExpanded ? "stretch" : "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderRadius: 4,
        borderColor: colors.onSurfaceVariant,
        opacity: enabled ? 1 : 0.5,
      },
    },
    createElement(
      View,
      { style: { flex: 1 } },
      labelText !== undefined && Text(labelText, { style: { fontSize: 12, color: colors.onSurfaceVariant } }),
      selected
        ? textChild(selected.child)
        : hint !== undefined
          ? createElement(DefaultTextStyleScope, { style: { color: colors.onSurfaceVariant } }, textChild(hint))
          : null
    ),
    Icon("arrow_drop_down")
  );

  return createElement(PaperMenu, {
    visible: open,
    onDismiss: () => setOpen(false),
    anchor,
    anchorPosition: "bottom",
    children: items.map((item, index) =>
      createElement(PaperMenu.Item, {
        key: index,
        title: textChild(item.child),
        disabled: item.enabled === false,
        onPress: () => {
          setOpen(false);
          onChanged?.(item.value);
        },
      })
    ),
  });
}
