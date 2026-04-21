import { useCallback } from "react";

type UpdateAttributes = (attrs: Record<string, unknown>) => void;

/**
 * Tiptap 커스텀 NodeView에서 배열 형태 attribute (items, events 등) 를 관리하는 훅.
 *
 * @param items   현재 배열 (node.attrs[attrKey])
 * @param attrKey updateAttributes 에 전달할 키
 * @param createEmpty 새 항목 빌더
 * @param updateAttributes Tiptap NodeView 의 updateAttributes
 */
export function useNodeListItems<T>(
  items: T[],
  attrKey: string,
  createEmpty: () => T,
  updateAttributes: UpdateAttributes,
) {
  const replace = useCallback(
    (next: T[]) => updateAttributes({ [attrKey]: next }),
    [attrKey, updateAttributes],
  );

  const add = useCallback(
    () => replace([...items, createEmpty()]),
    [items, createEmpty, replace],
  );

  const remove = useCallback(
    (idx: number) => replace(items.filter((_, i) => i !== idx)),
    [items, replace],
  );

  const update = useCallback(
    (idx: number, value: T) => {
      const next = items.slice();
      next[idx] = value;
      replace(next);
    },
    [items, replace],
  );

  const patch = useCallback(
    <K extends keyof T>(idx: number, key: K, value: T[K]) => {
      const next = items.slice();
      next[idx] = { ...(next[idx] as T), [key]: value };
      replace(next);
    },
    [items, replace],
  );

  return { add, remove, update, patch };
}
