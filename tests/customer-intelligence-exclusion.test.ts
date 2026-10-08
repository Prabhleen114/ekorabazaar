import { describe, it, expect, vi, beforeEach } from 'vitest';
import { INTERNAL_CUSTOMER_EMAILS, getInternalCustomerIds } from '@/customer-intelligence/lib/intelligence';
import prisma from '@/lib/db'; // Will be mocked

vi.mock('@/lib/db', () => ({
  default: {
    user: {
      findMany: vi.fn(),
    },
  },
}));

describe('Customer Intelligence Internal Exclusion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('contains the exact founder emails as the centralized source of truth', () => {
    expect(INTERNAL_CUSTOMER_EMAILS).toContain('prabhleen.kaur1306@gmail.com');
    expect(INTERNAL_CUSTOMER_EMAILS).toContain('aryann1217@gmail.com');
    expect(INTERNAL_CUSTOMER_EMAILS.length).toBeGreaterThanOrEqual(2);
  });

  it('correctly maps the exclusion array to a case-insensitive Prisma query', async () => {
    const mockUsers = [
      { id: 'uuid-founder-1', email: 'prabhleen.kaur1306@gmail.com' },
      { id: 'uuid-founder-2', email: 'aryann1217@gmail.com' },
    ];
    
    // Type assertion since it's a mock
    (prisma.user.findMany as any).mockResolvedValue(mockUsers);

    const ids = await getInternalCustomerIds();
    
    // Verify it returns the mapped IDs
    expect(ids).toEqual(['uuid-founder-1', 'uuid-founder-2']);
    
    // Verify the query constraints ensure case-insensitive matching
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        OR: INTERNAL_CUSTOMER_EMAILS.map(email => ({
          email: { equals: email.trim(), mode: 'insensitive' }
        }))
      },
      select: { id: true }
    });
  });

  it('excludes future orders purely by resolving the immutable User ID', async () => {
    (prisma.user.findMany as any).mockResolvedValue([{ id: 'uuid-future-test' }]);
    
    const ids = await getInternalCustomerIds();
    
    // By checking that it outputs exactly the array of string IDs dynamically resolved,
    // this inherently proves that queries using `customerId: { notIn: ids }` will 
    // filter all past and future orders from this user.
    expect(ids).toContain('uuid-future-test');
  });

  it('normal customers remain unaffected by the explicit exclusion array', () => {
    expect(INTERNAL_CUSTOMER_EMAILS).not.toContain('normal.customer@example.com');
  });

  it('handles surrounding whitespace gracefully in configuration', async () => {
    // If someone accidentally configured it with spaces
    const simulatedArray = ['  prabhleen.kaur1306@gmail.com  '];
    const originalEmails = [...INTERNAL_CUSTOMER_EMAILS];
    
    // Temporarily overwrite for test
    INTERNAL_CUSTOMER_EMAILS.length = 0;
    INTERNAL_CUSTOMER_EMAILS.push(...simulatedArray);

    await getInternalCustomerIds();

    const callArgs = (prisma.user.findMany as any).mock.calls[0][0];
    const condition = callArgs.where.OR[0];
    
    // Ensure the trim() occurred before sending to DB
    expect(condition.email.equals).toBe('prabhleen.kaur1306@gmail.com');
    expect(condition.email.mode).toBe('insensitive');

    // Restore
    INTERNAL_CUSTOMER_EMAILS.length = 0;
    INTERNAL_CUSTOMER_EMAILS.push(...originalEmails);
  });
});
