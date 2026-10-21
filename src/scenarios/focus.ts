// A stable callback ref focuses the new screen only when its heading mounts.
export function focusHeading(element:HTMLHeadingElement|null){element?.focus({preventScroll:true});}
