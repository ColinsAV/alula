import { createElement, type ReactElement } from "react";
import { ActivityIndicator, Switch as RNSwitch } from "react-native";
import NativeSlider from "@react-native-community/slider";
import { Checkbox as PaperCheckbox, ProgressBar, RadioButton } from "react-native-paper";
import { useNativeTheme } from "../theme/nativeTheme";

// Contrôles de formulaire et indicateurs sur mobile. Même API que
// controls.tsx : `onChanged` absent ou `null` désactive le contrôle.

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
  return createElement(PaperCheckbox.Android, {
    status: value === true ? "checked" : tristate && value === null ? "indeterminate" : "unchecked",
    disabled: !onChanged,
    // Cycle Flutter en tristate : false → true → null → false.
    onPress: () => onChanged?.(tristate ? (value === false ? true : value === true ? null : false) : !value),
  });
}

/** Interrupteur on / off. */
export function Switch(props: { value: boolean; onChanged?: ((value: boolean) => void) | null }): ReactElement {
  return createElement(SwitchView, props);
}

function SwitchView({ value, onChanged }: { value: boolean; onChanged?: ((value: boolean) => void) | null }) {
  const colors = useNativeTheme().data.colorScheme;
  return createElement(RNSwitch, {
    value,
    onValueChange: onChanged ?? undefined,
    disabled: !onChanged,
    trackColor: { true: colors.primary, false: colors.outline },
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
  return createElement(RadioButton.Android, {
    value: String(value),
    status: value === groupValue ? "checked" : "unchecked",
    disabled: !onChanged,
    onPress: () => onChanged?.(value),
  });
}

/** Curseur pour choisir une valeur entre `min` et `max`. `label` n'est pas affiché sur mobile. */
export function Slider(props: {
  value: number;
  min?: number;
  max?: number;
  divisions?: number;
  label?: string;
  onChanged?: ((value: number) => void) | null;
  onChangeEnd?: (value: number) => void;
}): ReactElement {
  return createElement(SliderView, props);
}

function SliderView({
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
  divisions?: number;
  label?: string;
  onChanged?: ((value: number) => void) | null;
  onChangeEnd?: (value: number) => void;
}) {
  const colors = useNativeTheme().data.colorScheme;
  return createElement(NativeSlider, {
    value,
    minimumValue: min,
    maximumValue: max,
    step: divisions ? (max - min) / divisions : 0,
    disabled: !onChanged,
    onValueChange: onChanged ?? undefined,
    onSlidingComplete: onChangeEnd,
    accessibilityLabel: label,
    minimumTrackTintColor: colors.primary,
    maximumTrackTintColor: colors.outline,
    thumbTintColor: colors.primary,
    style: { alignSelf: "stretch", height: 40 },
  });
}

/** Indicateur circulaire. Sur mobile, toujours indéterminé (`value` ignorée). */
export function CircularProgressIndicator(
  props: { value?: number; color?: string; strokeWidth?: number; size?: number } = {}
): ReactElement {
  return createElement(CircularView, props);
}

function CircularView({ color, size = 40 }: { color?: string; size?: number }) {
  const colors = useNativeTheme().data.colorScheme;
  return createElement(ActivityIndicator, { color: color ?? colors.primary, size: size >= 36 ? "large" : "small" });
}

/** Barre de progression : `value` de 0 à 1, ou absente pour une barre indéterminée. */
export function LinearProgressIndicator({
  value,
  color,
  minHeight = 4,
}: { value?: number; color?: string; minHeight?: number } = {}): ReactElement {
  return createElement(ProgressBar, {
    progress: value ?? 0,
    indeterminate: value === undefined,
    color,
    style: { height: minHeight, borderRadius: minHeight / 2 },
  });
}
