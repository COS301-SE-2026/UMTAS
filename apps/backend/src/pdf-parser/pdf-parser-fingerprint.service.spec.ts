import { BadRequestException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  computePdfStreamFingerprint,
  type PdfStreamFingerprintResult,
} from 'shared-types';
import { PdfParserFingerprintService } from './pdf-parser-fingerprint.service';

const computeFingerprintMock = jest.mocked(computePdfStreamFingerprint);

describe('PdfParserFingerprintService', () => {
  const service = new PdfParserFingerprintService();

  beforeEach(() => {
    computeFingerprintMock.mockReset();
  });

  it('delegates fingerprinting with a Node SHA-256 adapter', () => {
    const expected: PdfStreamFingerprintResult = {
      ok: true,
      hash: createHash('sha256').update('payload').digest('hex'),
      streamCount: 1,
      algorithmVersion: 'pdf-stream-payload-sha256-v1',
    };
    computeFingerprintMock.mockImplementation((_buffer, hash) => {
      hash.update(Buffer.from('payload'));
      return {
        ...expected,
        hash: hash.digestHex(),
      };
    });

    expect(service.compute(Buffer.from('pdf bytes'))).toEqual(expected);
    expect(computeFingerprintMock).toHaveBeenCalledTimes(1);
  });

  it('returns a successful fingerprint from computeOrThrow', () => {
    const expected: PdfStreamFingerprintResult = {
      ok: true,
      hash: 'fingerprint',
      streamCount: 1,
      algorithmVersion: 'pdf-stream-payload-sha256-v1',
    };
    computeFingerprintMock.mockReturnValue(expected);

    expect(service.computeOrThrow(Buffer.from('pdf bytes'))).toBe(expected);
  });

  it('rejects PDFs without fingerprintable streams', () => {
    computeFingerprintMock.mockReturnValue({
      ok: false,
      streamCount: 0,
      algorithmVersion: 'pdf-stream-payload-sha256-v1',
      reason: 'NO_STREAMS_FOUND',
    });

    expect(() => service.computeOrThrow(Buffer.from('invalid pdf'))).toThrow(
      BadRequestException,
    );
  });
});
