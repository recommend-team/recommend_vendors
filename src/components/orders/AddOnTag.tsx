/**
 * Marks an order line bought as an extra — drinks, extra protein — so it is packed with
 * the meal it came with rather than missed.
 */
export function AddOnTag() {
  return (
    <span className="ml-1.5 inline-block rounded-full bg-mint px-1.5 py-0.5 align-middle text-[10px] font-extrabold tracking-wide text-brand uppercase">
      Add-on
    </span>
  );
}
