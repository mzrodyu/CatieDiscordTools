// Shared component surface.
//
// Everything a plugin should ever need to build UI lives here. Plugins must not
// bring their own component library or hand-roll buttons and toggles; if a
// needed capability is missing, add it here so every plugin benefits and stays
// visually consistent.

export { Button } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";

export { Toggle } from "./Toggle";
export type { ToggleProps } from "./Toggle";

export { Section } from "./Section";
export type { SectionProps } from "./Section";

export { ListRow } from "./ListRow";
export type { ListRowProps } from "./ListRow";

export { Badge } from "./Badge";
export type { BadgeProps, BadgeTone } from "./Badge";

export { TextInput } from "./TextInput";
export type { TextInputProps } from "./TextInput";

export { NumberStepper } from "./NumberStepper";
export type { NumberStepperProps } from "./NumberStepper";

export { Select } from "./Select";
export type { SelectProps, SelectOption } from "./Select";

export { StringListEditor } from "./StringListEditor";
export type { StringListEditorProps } from "./StringListEditor";

export { EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";
