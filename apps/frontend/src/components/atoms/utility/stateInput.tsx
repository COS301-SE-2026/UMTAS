import { Input } from "../baseShadcn/input";
import { Textarea } from "../baseShadcn/textarea";

export interface InputProps<Type> {
  field: keyof Type;
  State: Type;
  update: (key: keyof Type, value: string) => void;
  type?: React.HTMLInputTypeAttribute;
}

// Type
export function StateInput<Type>({
  field,
  State,
  update,
  type,
}: InputProps<Type>) {
  if (type == "text-area")
    return (
      <div className="flex flex-col w-1/2 space-y-1">
        <label className="text-sm font-medium text-white">
          {String(field)}
        </label>
        <Textarea
          value={String(State[field]) ?? ""}
          onChange={(e) => update(field, e.target.value)}
        />
      </div>
    );

  return (
    <div className="flex flex-col w-1/2 space-y-1">
      <label className="text-sm font-medium text-white">{String(field)}</label>
      <Input
        value={String(State[field]) ?? ""}
        onChange={(e) => update(field, e.target.value)}
        type={type}
      />
    </div>
  );
}
