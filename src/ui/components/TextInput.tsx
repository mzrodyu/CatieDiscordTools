// Single-line text input.

export interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
}

export function TextInput({ value, onChange, className, ...rest }: TextInputProps) {
  return (
    <input
      className={className ? `hc-input ${className}` : "hc-input"}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      {...rest}
    />
  );
}
