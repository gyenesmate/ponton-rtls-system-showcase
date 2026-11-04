/**
 * Run all spatial self-checks. Exit non-zero if any failed.
 * npm run check:spatial
 */
import './gridMath.selfcheck';
import './footprint.selfcheck';
import './occupancy.selfcheck';
import './placement.selfcheck';
import './editApi.selfcheck';
import '../domain/siteAdapter.selfcheck';
