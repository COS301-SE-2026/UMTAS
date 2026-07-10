import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  computePdfStreamFingerprint,
  type PdfStreamFingerprintResult,
  type Sha256Hash,
} from 'shared-types';

@Injectable()
export class PdfParserFingerprintService {
  compute(buffer: Buffer | Uint8Array): PdfStreamFingerprintResult {
    return computePdfStreamFingerprint(buffer, createNodeSha256Hash());
  }

  computeOrThrow(
    buffer: Buffer | Uint8Array,
  ): Extract<PdfStreamFingerprintResult, { ok: true }> {
    const fingerprint = this.compute(buffer);
    if (!fingerprint.ok) {
      throw new BadRequestException(
        'Uploaded PDF does not contain stream payloads that can be fingerprinted',
      );
    }

    return fingerprint;
  }
}

function createNodeSha256Hash(): Sha256Hash {
  const hash = createHash('sha256');
  return {
    update(input) {
      hash.update(input);
    },
    digestHex() {
      return hash.digest('hex');
    },
  };
}
