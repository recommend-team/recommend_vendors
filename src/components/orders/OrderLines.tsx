import type { OrderLine, VendorOrder } from '../../lib/contract';
import { formatNaira } from '../../lib/format';
import { AddOnTag } from './AddOnTag';

/**
 * What to cook and pack, as the buyer built it: each dish with its portions, its choices
 * and its extras, and how many identical packs.
 *
 *   2 × Rice and beans                    ₦8,400
 *       2 portions each
 *       + Beef ×2, Takeaway pack ×1 in each pack
 *
 * The kitchen packs each pack the same way. An order from a server without \`lines\` is
 * shown the old way, one row per item.
 */
export function OrderLines({
  order,
  compact = false,
}: {
  order: VendorOrder;
  /** The card in the list: no prices, details kept short. */
  compact?: boolean;
}) {
  if (!order.lines) {
    return <FlatItems order={order} compact={compact} />;
  }
  if (order.lines.length === 0) {
    return <p className="text-[14px] text-ink-faint">No items recorded</p>;
  }

  return (
    <ul className={compact ? 'space-y-2' : 'space-y-3'}>
      {order.lines.map((line, index) => (
        <Line key={index} line={line} compact={compact} />
      ))}
    </ul>
  );
}

function Line({ line, compact }: { line: OrderLine; compact: boolean }) {
  const built =
    line.packs > 1 || line.extras.length > 0 || line.choices.length > 0;
  const each = line.packs > 1 ? ' each' : '';
  const details: string[] = [];
  if (built) {
    details.push(`${portions(line)}${each}`);
    for (const choice of groupChoices(line)) details.push(choice);
    if (line.extras.length > 0) {
      details.push(
        `+ ${line.extras.map((e) => `${e.name} ×${e.quantity}`).join(', ')}${line.packs > 1 ? ' in each pack' : ''}`,
      );
    }
  }

  return (
    <li className="text-[14px]">
      <div className="flex items-baseline gap-2">
        <span
          className={`shrink-0 font-extrabold ${compact ? 'text-ink' : 'text-ink-faint'}`}
        >
          {line.quantity}×
        </span>
        <span className="min-w-0 flex-1 font-bold text-ink">
          {line.productName}
          {built && line.packs > 1 && (
            <span className="ml-1.5 inline-block rounded-full bg-amber px-1.5 py-0.5 align-middle text-[10px] font-extrabold tracking-wide text-ink-soft uppercase">
              {line.packs} packs
            </span>
          )}
          {line.isAddOn && <AddOnTag />}
        </span>
        {!compact && (
          <span className="shrink-0 text-ink-soft">
            {formatNaira(line.lineTotal)}
          </span>
        )}
      </div>
      {details.length > 0 && (
        // Never cut short, even on the card: the extras line is what gets packed.
        <ul className="mt-0.5 space-y-0.5 pl-7 text-[12px] leading-snug text-ink-soft">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** "2 portions", "1 plate", or "×2" for a dish with no unit. */
function portions(line: OrderLine): string {
  if (!line.unit) return `×${line.portions}`;
  return `${line.portions} ${line.portions === 1 ? line.unit : `${line.unit}s`}`;
}

/** "Protein: Beef" — options of one choice together. */
function groupChoices(line: OrderLine): string[] {
  const byGroup = new Map<string, string[]>();
  for (const c of line.choices) {
    byGroup.set(c.group, [...(byGroup.get(c.group) ?? []), c.option]);
  }
  return [...byGroup].map(
    ([group, options]) => `${group}: ${options.join(' & ')}`,
  );
}

/** An order from before packs: one row per item. */
function FlatItems({
  order,
  compact,
}: {
  order: VendorOrder;
  compact: boolean;
}) {
  if (order.items.length === 0) {
    return <p className="text-[14px] text-ink-faint">No items recorded</p>;
  }
  return (
    <ul className="space-y-1.5">
      {order.items.map((item) => (
        <li key={item.id} className="flex items-baseline gap-2 text-[14px]">
          <span
            className={`shrink-0 font-extrabold ${compact ? 'text-ink' : 'text-ink-faint'}`}
          >
            {item.quantity}×
          </span>
          <span
            className={`min-w-0 flex-1 text-ink ${compact ? 'truncate' : ''}`}
          >
            {item.productName}
            {item.isAddOn && <AddOnTag />}
          </span>
          {!compact && (
            <span className="shrink-0 text-ink-soft">
              {formatNaira(item.lineTotal)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
