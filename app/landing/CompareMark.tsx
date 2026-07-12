import { Check, Minus } from "lucide-react";

type Props = {
  value: boolean;
};

export function CompareMark({ value }: Props) {
  if (value) {
    return (
      <span className="lp-compare-mark lp-compare-mark-yes">
        <Check aria-hidden size={15} strokeWidth={2.75} />
        <span className="sr-only">Yes</span>
      </span>
    );
  }

  return (
    <span className="lp-compare-mark lp-compare-mark-no">
      <Minus aria-hidden size={15} strokeWidth={2.25} />
      <span className="sr-only">No</span>
    </span>
  );
}
