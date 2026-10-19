# VoucherNest Firebase Security Specification

## 1. Data Invariants
1. **User Identity & Role Immutability**: Standard users cannot modify their own `role` or self-assign `admin` privilege.
2. **Coupon Integrity**: Only authenticated users with `role == 'admin'` can create, update, or delete coupons.
3. **Public Read-Only Access for Active Coupons**: Visitors can view active coupons, but cannot write.
4. **Claim Ownership**: A claim must have `userId == request.auth.uid`. A user can only read their own claims unless admin.
5. **No Negative Inventory / State Spoofing**: Discount values, codes, and IDs must conform to regex and length limits.

## 2. Dirty Dozen Test Payloads
1. Non-admin attempting to create a coupon (`/coupons/cpn-evil-1`).
2. Non-admin attempting to update coupon discount to "100% OFF".
3. Non-admin attempting to delete an existing coupon.
4. User attempting to register with `role: "admin"` directly in `/users/{userId}`.
5. User attempting to escalate their own role from `"user"` to `"admin"`.
6. User attempting to claim a coupon under another user's `userId`.
7. Malicious user injecting 100KB junk into coupon `code` or `title`.
8. Unauthenticated user attempting to write a claim.
9. User attempting to read other users' private claims without ownership.
10. Attacker modifying another user's claim transaction status.
11. User attempting to tamper with immutability field `createdAt`.
12. Malicious user sending invalid document ID paths with path traversal characters.
