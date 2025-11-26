# Backend Services

## Active Services

### `worker.service.ts` ✅
- **Purpose**: Communicates with Cloudflare Worker
- **Method**: `parsePdf(pdfBase64: string)` - Sends entire PDF to Worker
- **Returns**: Complete UniversalFitnessPlan from Worker

## Deprecated Services (Not Used in v5.0)

### `pdf.service.ts` ❌
- **Status**: Not used anymore
- **Reason**: Worker handles PDF processing internally
- **Can be deleted**: Yes, if you want to clean up

### `merge.service.ts` ❌
- **Status**: Not used anymore
- **Reason**: Worker returns complete plan, no merging needed
- **Can be deleted**: Yes, if you want to clean up

## Migration Notes

In v5.0, the architecture changed:
- **Before**: Backend split PDF → Sent pages to Worker → Merged results
- **After**: Backend sends entire PDF → Worker returns complete plan

The Worker now handles all PDF processing internally.

