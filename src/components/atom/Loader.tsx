import clsx from "clsx";
import { CSSProperties } from "react";
import { CgSpinnerAlt } from "react-icons/cg";

export const Loader = ({
  size = "small",
  className,
  color = "inherit",
}: LoaderProps) => {
  const sizeProps = {
    small: { length: 18, strokeWidth: 2 },
    medium: { length: 28, strokeWidth: 3 },
    large: { length: 48, strokeWidth: 6 },
  };
  const { length } = sizeProps[size!];

  const styles: Record<string, CSSProperties> = {
    spin_loader: {
      width: `${length}px`,
      height: `${length}px`,
      display: "inline-block",
      color: color,
      animation: "spin 750ms linear infinite",
    },
  };
  return (
    <>
      <CgSpinnerAlt style={styles.spin_loader} className={clsx(className, "animate-spin")}/>
    </>
  );
};

type LoaderProps = {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  color?: string;
};
