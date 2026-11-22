import { useEffect, useRef, type ReactNode } from 'react';

let isFirstHeading = true;

// Client-side navigation doesn't move focus the way a full page load does, so screen
// reader users wouldn't hear that the page changed. Each page's heading takes focus
// when it mounts, which also covers pages that show a spinner before their content.
// The very first heading after load is skipped so the skip link stays the first stop.
export function PageHeading({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (isFirstHeading) {
      isFirstHeading = false;
      return;
    }
    heading.current?.focus();
  }, []);

  return (
    <h1 ref={heading} tabIndex={-1} className={className}>
      {children}
    </h1>
  );
}
