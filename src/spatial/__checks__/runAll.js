/**
 * Run all spatial self-checks. Exit non-zero if any failed.
 * npm run check:spatial
 */
import './gridMath.selfcheck.js';
import './footprint.selfcheck.js';
import './occupancy.selfcheck.js';
import './placement.selfcheck.js';
import './editApi.selfcheck.js';
import '../../domain/__checks__/siteAdapter.selfcheck.js';

