import { data } from '@/lib/research';
export function GET() {
  return Response.json({
    status: 'ready',
    mode: 'executed_evidence',
    runs: data.results.length,
    rounds: data.rounds.length,
    inference_available: false,
    training_available: false,
    source_hash: data.source.sha256,
  });
}
