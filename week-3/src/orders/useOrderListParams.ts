import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { orderListParamsSchema, type OrderListParams } from './schemas.ts';

const DEFAULTS = orderListParamsSchema.parse({});

// The URL is the single source of truth for the list's filters, sort and page, so a
// view can be bookmarked, shared or restored with the back button.
export function useOrderListParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(
    () => orderListParamsSchema.parse(Object.fromEntries(searchParams)),
    [searchParams],
  );

  const updateParams = useCallback(
    (changes: Partial<OrderListParams>) => {
      setSearchParams(
        (current) => {
          const next = {
            ...orderListParamsSchema.parse(Object.fromEntries(current)),
            ...changes,
          };
          // Any change other than paging starts from page 1 again.
          if (!('page' in changes)) next.page = 1;

          const query = new URLSearchParams();
          for (const [key, value] of Object.entries(next)) {
            if (value === undefined || value === DEFAULTS[key as keyof OrderListParams])
              continue;
            query.set(key, String(value));
          }
          return query;
        },
        { replace: !('page' in changes) },
      );
    },
    [setSearchParams],
  );

  return [params, updateParams] as const;
}
