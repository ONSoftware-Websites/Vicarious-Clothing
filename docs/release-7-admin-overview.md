# Release 7 — Admin shell and dashboard, phase 1

This phase preserves the existing Vicarious branding: display and monospace fonts, ink/paper/cream surfaces, cyan accent and BrandMark. No storefront styles, endpoints, or database migrations changed.

## Delivered
- `src/components/admin/admin-shell.tsx`: responsive desktop sidebar, mobile overlay menu, grouped links, active-page highlighting, role-aware navigation, store link, logout and role label.
- `src/app/admin/(protected)/layout.tsx`: session gate and new shell integration.
- `src/app/admin/(protected)/page.tsx`: new overview with daily paid-order metrics, operational action queues, inventory snapshot, recent orders, recent activity, and quick actions.

## Permissions
Navigation visibility is presentational only; API/page authorization must still be checked server-side. Financial and order information in the overview is restricted to ADMIN and above, while inventory and leads controls require MANAGER. Confirm appropriate access for STAFF and all nested routes.

## Testing / acceptance
- Build and lint after deployment in a working checkout.
- Check desktop, tablet, and mobile menu open/close, focus and click-through.
- Confirm all navigation links resolve and current-page highlighting works.
- Test STAFF, MANAGER, ADMIN, OWNER, SUPER_ADMIN account navigation and direct URL access.
- Verify dashboard metrics with known real records.
- Test missing data and empty states.
- Check with real operating data that paid status definitions and refund exclusions are correct.

Maintenance mode and once-daily cron remain untouched.
