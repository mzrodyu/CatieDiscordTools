// Button.
//
// Four variants (primary / secondary / plain / destructive) and three sizes.
// A leading icon is optional. Everything else is a normal <button>.

export type ButtonVariant = "primary" | "secondary" | "plain" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Optional leading icon element. */
  icon?: React.ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = ["hc-btn", `hc-btn--${variant}`];
  if (size !== "md") classes.push(`hc-btn--${size}`);
  if (className) classes.push(className);

  return (
    <button type={type} className={classes.join(" ")} {...rest}>
      {icon}
      {children != null && children !== false && <span>{children}</span>}
    </button>
  );
}
