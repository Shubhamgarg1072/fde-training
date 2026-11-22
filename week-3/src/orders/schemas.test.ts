import { orderListParamsSchema } from './schemas.ts';

describe('orderListParamsSchema', () => {
  it('fills in defaults for an empty query', () => {
    expect(orderListParamsSchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
      sort: 'createdAt',
      order: 'desc',
      status: undefined,
      q: undefined,
    });
  });

  it('coerces valid strings from the URL', () => {
    expect(
      orderListParamsSchema.parse({
        page: '3',
        pageSize: '50',
        sort: 'totalCents',
        order: 'asc',
        status: 'shipped',
        q: ' priya ',
      }),
    ).toEqual({
      page: 3,
      pageSize: 50,
      sort: 'totalCents',
      order: 'asc',
      status: 'shipped',
      q: 'priya',
    });
  });

  it('falls back field by field on hand-edited junk', () => {
    const parsed = orderListParamsSchema.parse({
      page: '-2',
      pageSize: '7',
      sort: 'password',
      status: 'lost',
      q: '   ',
    });
    expect(parsed).toMatchObject({
      page: 1,
      pageSize: 20,
      sort: 'createdAt',
      status: undefined,
    });
    expect(parsed.q).toBeUndefined();
  });
});
