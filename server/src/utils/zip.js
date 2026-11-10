/**
 * Minimal ZIP writer (STORE method, no compression).
 *
 * Generated projects are small text files, so an uncompressed archive is
 * perfectly reasonable and avoids pulling a native archive dependency into the
 * API. The output is a standard ZIP that opens in Finder, Explorer, `unzip` and
 * GitHub's uploader.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    crc = CRC_TABLE[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const dosDateTime = (date = new Date()) => {
  const year = Math.max(1980, date.getFullYear());
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: day };
};

/**
 * @param {Array<{ path: string, content: string }>} files
 * @param {Date} [now]
 * @returns {Buffer}
 */
export function createZip(files, now = new Date()) {
  const { time, date } = dosDateTime(now);
  const entries = files.map((file) => {
    const name = Buffer.from(String(file.path || 'file.txt').replace(/\\/g, '/'), 'utf8');
    const data = Buffer.isBuffer(file.content) ? file.content : Buffer.from(String(file.content ?? ''), 'utf8');
    return { name, data, crc: crc32(data), offset: 0 };
  });

  const localParts = [];
  let offset = 0;

  for (const entry of entries) {
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4); // version needed
    header.writeUInt16LE(0x0800, 6); // UTF-8 filename
    header.writeUInt16LE(0, 8); // store
    header.writeUInt16LE(time, 10);
    header.writeUInt16LE(date, 12);
    header.writeUInt32LE(entry.crc, 14);
    header.writeUInt32LE(entry.data.length, 18);
    header.writeUInt32LE(entry.data.length, 22);
    header.writeUInt16LE(entry.name.length, 26);
    header.writeUInt16LE(0, 28);

    entry.offset = offset;
    localParts.push(header, entry.name, entry.data);
    offset += header.length + entry.name.length + entry.data.length;
  }

  const centralParts = [];
  let centralSize = 0;

  for (const entry of entries) {
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4); // version made by
    header.writeUInt16LE(20, 6); // version needed
    header.writeUInt16LE(0x0800, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(time, 12);
    header.writeUInt16LE(date, 14);
    header.writeUInt32LE(entry.crc, 16);
    header.writeUInt32LE(entry.data.length, 20);
    header.writeUInt32LE(entry.data.length, 24);
    header.writeUInt16LE(entry.name.length, 28);
    header.writeUInt16LE(0, 30); // extra
    header.writeUInt16LE(0, 32); // comment
    header.writeUInt16LE(0, 34); // disk
    header.writeUInt16LE(0, 36); // internal attributes
    header.writeUInt32LE(0o644 << 16, 38); // external attributes
    header.writeUInt32LE(entry.offset, 42);

    centralParts.push(header, entry.name);
    centralSize += header.length + entry.name.length;
  }

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

/** Safe archive name, e.g. "campus-event-portal.zip". */
export const zipFilename = (title) => {
  const slug = String(title || 'portiai-project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${slug || 'portiai-project'}.zip`;
};

export { crc32 };
