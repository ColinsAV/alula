"use client";

import { createElement, type ReactElement, type ReactNode } from "react";
import MuiButton from "@mui/material/Button";
import MuiFab from "@mui/material/Fab";
import MuiIconButton from "@mui/material/IconButton";
import MuiMenuItem from "@mui/material/MenuItem";
import MuiTextField from "@mui/material/TextField";
import MuiTooltip from "@mui/material/Tooltip";

// Widgets Material, rendus par MUI (donc stylés par le ThemeProvider).

/** Callback d'un bouton. `null` / absent : bouton désactivé, comme en Flutter. */
export type VoidCallback = (() => void) | null | undefined;

// --- Boutons ----------------------------------------------------------------

interface ButtonProps {
  onPressed?: VoidCallback;
  child: ReactNode;
}

interface ButtonIconProps {
  onPressed?: VoidCallback;
  icon: ReactNode;
  label: ReactNode;
}

function makeButton(variant: "contained" | "text" | "outlined") {
  function button({ onPressed, child }: ButtonProps): ReactElement {
    return createElement(
      MuiButton,
      { variant, disabled: !onPressed, onClick: onPressed ?? undefined },
      child
    );
  }

  /** Bouton avec une icône devant le libellé. */
  button.icon = ({ onPressed, icon, label }: ButtonIconProps): ReactElement =>
    createElement(
      MuiButton,
      { variant, disabled: !onPressed, onClick: onPressed ?? undefined, startIcon: icon },
      label
    );

  return button;
}

/** Bouton plein, pour l'action principale. */
export const ElevatedButton = makeButton("contained");
/** Bouton texte, pour les actions secondaires. */
export const TextButton = makeButton("text");
/** Bouton avec bordure. */
export const OutlinedButton = makeButton("outlined");

/** Bouton icône : `IconButton({ icon: Icon(AddIcon), onPressed: add, tooltip: "Ajouter" })`. */
export function IconButton({
  icon,
  onPressed,
  tooltip,
  color,
}: {
  icon: ReactNode;
  onPressed?: VoidCallback;
  /** Texte au survol (et libellé d'accessibilité). */
  tooltip?: string;
  color?: string;
}): ReactElement {
  const button = createElement(
    MuiIconButton,
    {
      disabled: !onPressed,
      onClick: onPressed ?? undefined,
      "aria-label": tooltip,
      style: { color },
    },
    icon
  );
  // <span> : un Tooltip MUI ne s'accroche pas à un bouton désactivé.
  return tooltip
    ? createElement(MuiTooltip, { title: tooltip, children: createElement("span", null, button) })
    : button;
}

/** Bouton rond flottant (placé en bas à droite par Scaffold). */
export function FloatingActionButton({
  onPressed,
  child,
  tooltip,
}: {
  onPressed?: VoidCallback;
  child: ReactNode;
  tooltip?: string;
}): ReactElement {
  const fab = createElement(
    MuiFab,
    { color: "primary", disabled: !onPressed, onClick: onPressed ?? undefined, "aria-label": tooltip },
    child
  );
  return tooltip ? createElement(MuiTooltip, { title: tooltip, children: fab }) : fab;
}

/** Bouton flottant allongé, avec icône et libellé. */
FloatingActionButton.extended = ({
  onPressed,
  icon,
  label,
}: {
  onPressed?: VoidCallback;
  icon?: ReactNode;
  label: ReactNode;
}): ReactElement =>
  createElement(
    MuiFab,
    { color: "primary", variant: "extended", disabled: !onPressed, onClick: onPressed ?? undefined },
    icon && createElement("span", { style: { display: "flex", marginRight: 8 } }, icon),
    label
  );

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

export interface InputDecoration {
  labelText?: string;
  hintText?: string;
  helperText?: string;
  /** Affiché en rouge à la place de `helperText`. */
  errorText?: string;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
  /** `outline` (défaut), `underline`, ou `filled`. */
  border?: "outline" | "underline" | "filled";
}

export function InputDecoration(decoration: InputDecoration): InputDecoration {
  return decoration;
}

export interface TextFieldProps {
  /** Valeur contrôlée — à mettre à jour dans `onChanged`. */
  value?: string;
  /** Valeur de départ, si le champ n'est pas contrôlé. */
  initialValue?: string;
  onChanged?: (value: string) => void;
  /** Validation au clavier (touche Entrée). */
  onSubmitted?: (value: string) => void;
  decoration?: InputDecoration;
  keyboardType?: TextInputType;
  /** Champ mot de passe. */
  obscureText?: boolean;
  /** Nombre de lignes affichées (implique un champ multiligne si > 1). */
  maxLines?: number;
  enabled?: boolean;
  autofocus?: boolean;
}

/** Champ de saisie : `TextField({ value, onChanged, decoration: InputDecoration({ labelText: "Nom" }) })`. */
export function TextField({
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
}: TextFieldProps = {}): ReactElement {
  const multiline = keyboardType === "multiline" || (maxLines !== undefined && maxLines > 1);
  const variant =
    decoration.border === "underline" ? "standard" : decoration.border === "filled" ? "filled" : "outlined";

  return createElement(MuiTextField, {
    value,
    defaultValue: initialValue,
    onChange: (event: { target: { value: string } }) => onChanged?.(event.target.value),
    onKeyDown: (event: { key: string; target: unknown }) => {
      if (event.key === "Enter" && !multiline) {
        onSubmitted?.((event.target as HTMLInputElement).value);
      }
    },
    label: decoration.labelText,
    placeholder: decoration.hintText,
    helperText: decoration.errorText ?? decoration.helperText,
    error: decoration.errorText !== undefined,
    type: obscureText ? "password" : keyboardType === "multiline" ? "text" : keyboardType,
    multiline,
    rows: multiline ? maxLines : undefined,
    disabled: !enabled,
    autoFocus: autofocus,
    variant,
    fullWidth: true,
    slotProps: {
      input: {
        startAdornment: decoration.prefixIcon,
        endAdornment: decoration.suffixIcon,
      },
    },
  });
}

// --- DropdownButton (combo box) ---------------------------------------------

/** Une option de DropdownButton. */
export interface DropdownMenuItem<T> {
  value: T;
  child: ReactNode;
  enabled?: boolean;
}

export function DropdownMenuItem<T>(item: DropdownMenuItem<T>): DropdownMenuItem<T> {
  return item;
}

export interface DropdownButtonProps<T> {
  /** Valeur sélectionnée (`undefined` : rien, `hint` affiché). Comparée avec `===`. */
  value?: T;
  items: DropdownMenuItem<T>[];
  /** `null` / absent : liste désactivée. */
  onChanged?: ((value: T) => void) | null;
  /** Affiché quand rien n'est sélectionné. */
  hint?: ReactNode;
  /** Libellé au-dessus du champ. */
  labelText?: string;
  /** Prend toute la largeur disponible. */
  isExpanded?: boolean;
}

/**
 * Liste déroulante :
 * ```ts
 * DropdownButton({
 *   value: this.fruit,
 *   items: fruits.map((f) => DropdownMenuItem({ value: f, child: Text(f) })),
 *   onChanged: (f) => this.setState(() => { this.fruit = f; }),
 * })
 * ```
 * Les valeurs peuvent être de n'importe quel type (objets compris).
 */
export function DropdownButton<T>({
  value,
  items,
  onChanged,
  hint,
  labelText,
  isExpanded = false,
}: DropdownButtonProps<T>): ReactElement {
  // MUI compare des valeurs simples : on travaille avec l'index de l'option.
  const selectedIndex = items.findIndex((item) => item.value === value);

  return createElement(
    MuiTextField,
    {
      select: true,
      label: labelText,
      value: selectedIndex === -1 ? "" : String(selectedIndex),
      onChange: (event: { target: { value: string } }) => {
        const item = items[Number(event.target.value)];
        if (item) onChanged?.(item.value);
      },
      disabled: !onChanged,
      fullWidth: isExpanded,
      slotProps: {
        select: {
          displayEmpty: hint !== undefined,
          renderValue: (selected: unknown) =>
            selected === "" ? hint : items[Number(selected)]?.child,
        },
        inputLabel: hint !== undefined ? { shrink: true } : undefined,
      },
    },
    ...items.map((item, index) =>
      createElement(
        MuiMenuItem,
        { key: index, value: String(index), disabled: item.enabled === false },
        item.child
      )
    )
  );
}
