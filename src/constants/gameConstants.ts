/**
 * Client constants - re-exports from shared constants
 */

// Re-export everything from shared constants
export * from '../../shared/constants/gameConstants';

// Default export for backward compatibility
import * as constants from '../../shared/constants/gameConstants';
export default constants;
