import { createHash } from 'node:crypto';
import { PdfParserFingerprintService } from './pdf-parser-fingerprint.service';

describe('PdfParserFingerprintService', () => {
  const service = new PdfParserFingerprintService();

  it.each(['\r\n', '\n', '\r'])(
    'hashes stream payloads with %j line endings',
    (lineEnding) => {
      const result = service.compute(
        bytes(
          `1 0 obj${lineEnding}<< /Length 7 >>${lineEnding}stream${lineEnding}payload${lineEnding}endstream${lineEnding}endobj`,
        ),
      );

      expect(result).toEqual({
        ok: true,
        hash: expectedHash(['payload']),
        streamCount: 1,
        algorithmVersion: 'pdf-stream-payload-sha256-v1',
      });
    },
  );

  it('hashes multiple streams in file order with length separators', () => {
    const result = service.compute(
      bytes(
        '%PDF-1.7\n1 0 obj\n<< /Length 2 >>\nstream\nab\nendstream\nendobj\n2 0 obj\n<< /Length 1 >>\nstream\nc\nendstream\nendobj\n',
      ),
    );

    expect(result).toMatchObject({
      ok: true,
      hash: expectedHash(['ab', 'c']),
      streamCount: 2,
    });
    expect(expectedHash(['ab', 'c'])).not.toBe(expectedHash(['a', 'bc']));
  });

  it('ignores changes outside stream payloads', () => {
    const first = service.compute(
      bytes(
        '%PDF-1.7\n1 0 obj\n<< /Length 7 >>\nstream\npayload\nendstream\nendobj\ntrailer <</ID [<one>]>> /CreationDate (A)',
      ),
    );
    const second = service.compute(
      bytes(
        '%PDF-1.7\n1 0 obj\n<< /Length 7 >>\nstream\npayload\nendstream\nendobj\ntrailer <</ID [<two>]>> /CreationDate (B)',
      ),
    );

    expect(first.ok && first.hash).toBe(second.ok && second.hash);
  });

  it('changes when stream payload bytes change', () => {
    const first = service.compute(
      bytes(
        '%PDF-1.7\n1 0 obj\n<< /Length 7 >>\nstream\npayload\nendstream\nendobj\n',
      ),
    );
    const second = service.compute(
      bytes(
        '%PDF-1.7\n1 0 obj\n<< /Length 7 >>\nstream\nchanged\nendstream\nendobj\n',
      ),
    );

    expect(first.ok && first.hash).not.toBe(second.ok && second.hash);
  });

  it('returns a structured failure when no streams are found', () => {
    expect(service.compute(bytes('%PDF-1.7 no stream payloads'))).toEqual({
      ok: false,
      streamCount: 0,
      algorithmVersion: 'pdf-stream-payload-sha256-v1',
      reason: 'NO_STREAMS_FOUND',
    });
  });
});

function bytes(value: string): Buffer {
  return Buffer.from(value, 'utf8');
}

function expectedHash(payloads: string[]): string {
  const hash = createHash('sha256');
  for (const payload of payloads) {
    const payloadBytes = bytes(payload);
    hash.update(encodeUint64BigEndian(payloadBytes.byteLength));
    hash.update(payloadBytes);
  }

  return hash.digest('hex');
}

function encodeUint64BigEndian(value: number): Buffer {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(value));
  return buffer;
}
