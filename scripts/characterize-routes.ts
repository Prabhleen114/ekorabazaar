import { runVerification } from './verify-consolidated-routes';

export { runVerification };

if (require.main === module || process.argv[1]?.endsWith('characterize-routes.ts')) {
  runVerification().catch(err => {
    console.error('Characterization verification error:', err);
    process.exit(1);
  });
}
