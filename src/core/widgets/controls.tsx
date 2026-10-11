"use client";

import { createElement, type ReactElement } from "react";
import MuiCheckbox from "@mui/material/Checkbox";
import MuiCircularProgress from "@mui/material/CircularProgress";
import MuiLinearProgress from "@mui/material/LinearProgress";
import MuiRadio from "@mui/material/Radio";
import MuiSlider from "@mui/material/Slider";
import MuiSwitch from "@mui/material/Switch";

// Contrôles de formulaire et indicateurs. Comme en Flutter : `onChanged`
// absent ou `null` = contrôle désactivé.

/** Case à cocher. `tristate` : `value` peut valoir `null` (état indéterminé). */
export function Checkbox({
  value,
  onChanged,
  tristate = false,
}: {
  value: boolean | null;
  onChanged?: ((value: boolean | null) => void) | null;
  tristate?: boolean;
}): ReactElement {
  return createElement(MuiCheckbox, {
    checked: value === true,
    indeterminate: tristate && value === null,
    disabled: !onChanged,
    // Cycle Flutter en tristate : false → true → null → false.
    onChange: () => onChanged?.(tristate ? (value === false ? true : value === true ? null : false) : !value),
  });
}

/** Interrupteur on / off. */
export function Switch({
  value,
  onChanged,
}: {
  value: boolean;
  onChanged?: ((value: boolean) => void) | null;
}): ReactElement {
  return createElement(MuiSwitch, {
    checked: value,
    disabled: !onChanged,
    onChange: (_: unknown, checked: boolean) => onChanged?.(checked),
  });
}

/** Bouton radio : sélectionné quand `value === groupValue`. */
export function Radio<T>({
  value,
  groupValue,
  onChanged,
}: {
  value: T;
  groupValue: T | undefined;
  onChanged?: ((value: T) => void) | null;
}): ReactElement {
  return createElement(MuiRadio, {
    checked: value === groupValue,
    disabled: !onChanged,
    onChange: () => onChanged?.(value),
  });
}

/** Curseur pour choisir une valeur entre `min` et `max`. */
export function Slider({
  value,
  min = 0,
  max = 1,
  divisions,
  label,
  onChanged,
  onChangeEnd,
}: {
  value: number;
  min?: number;
  max?: number;
  /** Nombre de crans. Absent : valeur continue. */
  divisions?: number;
  /** Bulle affichée au-dessus du curseur pendant le glissement. */
  label?: string;
  onChanged?: ((value: number) => void) | null;
  onChangeEnd?: (value: number) => void;
}): ReactElement {
  return createElement(MuiSlider, {
    value,
    min,
    max,
    step: divisions ? (max - min) / divisions : (max - min) / 1000,
    marks: divisions !== undefined,
    disabled: !onChanged,
    valueLabelDisplay: label !== undefined ? "auto" : "off",
    valueLabelFormat: () => label,
    onChange: (_: unknown, newValue: number | number[]) => onChanged?.(newValue as number),
    onChangeCommitted: (_: unknown, newValue: number | number[]) => onChangeEnd?.(newValue as number),
  });
}

/** Indicateur de chargement circulaire. `value` (0 → 1) : progression connue. */
export function CircularProgressIndicator({
  value,
  color,
  strokeWidth = 4,
  size = 40,
}: {
  value?: number;
  color?: string;
  strokeWidth?: number;
  size?: number;
} = {}): ReactElement {
  return createElement(MuiCircularProgress, {
    variant: value === undefined ? "indeterminate" : "determinate",
    value: value === undefined ? undefined : value * 100,
    size,
    thickness: (strokeWidth / size) * 44, // l'épaisseur MUI est relative à une boîte de 44px
    style: { color },
  });
}

/** Barre de progression horizontale. `value` (0 → 1) : progression connue. */
export function LinearProgressIndicator({
  value,
  color,
  minHeight = 4,
}: {
  value?: number;
  color?: string;
  minHeight?: number;
} = {}): ReactElement {
  return createElement(MuiLinearProgress, {
    variant: value === undefined ? "indeterminate" : "determinate",
    value: value === undefined ? undefined : value * 100,
    sx: { height: minHeight, ...(color && { "& .MuiLinearProgress-bar": { backgroundColor: color } }) },
  });
}
