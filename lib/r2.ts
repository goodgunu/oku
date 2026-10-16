import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { ParsedPhoto } from "@/lib/types";

const MAX_PHOTOS = 20;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export function isR2Enabled(): boolean {
  const e = process.env;
  return Boolean(e.R2_ACCESS_KEY_ID && e.R2_SECRET_ACCESS_KEY && e.R2_ACCOUNT_ID && e.R2_BUCKET);
}

let client: S3Client | null = null;
function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      },
    });
  }
  return client;
}
const bucket = () => process.env.R2_BUCKET as string;

export function recordKey(folder: string, id: string): string {
  return `records/${folder}/${id.toLowerCase()}.json`;
}

export function photoKey(folder: string, id: string, index: number, ext: string): string {
  return `photos/${folder}/${id.toLowerCase()}/${index}.${ext}`;
}

export async function copyR2Object(from: string, to: string): Promise<boolean> {
  try {
    await s3().send(new CopyObjectCommand({ Bucket: bucket(), Key: to, CopySource: `${bucket()}/${from}` }));
    return true;
  } catch {
    return false;
  }
}

export function extFromContentType(type: string | null): string | null {
  const t = (type || "").split(";")[0].trim().toLowerCase();
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  };
  return map[t] ?? null;
}

export async function putR2Json(key: string, value: unknown): Promise<void> {
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: JSON.stringify(value),
      ContentType: "application/json",
    }),
  );
}

export async function getR2Json<T>(key: string): Promise<T | null> {
  try {
    const res = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    const text = await res.Body?.transformToString();
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
}

export async function listR2Keys(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const res = await s3().send(
      new ListObjectsV2Command({ Bucket: bucket(), Prefix: prefix, ContinuationToken: token }),
    );
    for (const o of res.Contents ?? []) if (o.Key) keys.push(o.Key);
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

/** prefix で始まるオブジェクトをすべて削除（キー1つ指定でもOK） */
export async function deleteR2Prefix(prefix: string): Promise<void> {
  const keys = await listR2Keys(prefix);
  for (let i = 0; i < keys.length; i += 1000) {
    await s3().send(
      new DeleteObjectsCommand({
        Bucket: bucket(),
        Delete: { Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })) },
      }),
    );
  }
}

export async function getR2Object(key: string) {
  try {
    const res = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    if (!res.Body) return null;
    return { body: res.Body.transformToWebStream(), contentType: res.ContentType, length: res.ContentLength };
  } catch {
    return null;
  }
}

function photoHostOk(url: string, hosts?: string[]): boolean {
  if (!hosts) return true;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const h = u.hostname.toLowerCase();
    return hosts.some((a) => h === a || h.endsWith(`.${a}`));
  } catch {
    return false;
  }
}

async function downloadPhoto(url: string, hosts?: string[]): Promise<{ data: Buffer; ext: string } | null> {
  if (!photoHostOk(url, hosts)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const ext = extFromContentType(res.headers.get("content-type"));
    if (!ext) return null;
    const len = Number(res.headers.get("content-length") || 0);
    if (len > MAX_PHOTO_BYTES) return null;
    const data = Buffer.from(await res.arrayBuffer());
    if (data.length > MAX_PHOTO_BYTES || data.length === 0) return null;
    return { data, ext };
  } catch {
    return null;
  }
}

/**
 * 写真を最大20枚まで R2 に保存。失敗した写真は key なし（元URLのまま）。
 * 既に保存済みの同じURLは再ダウンロードしない。
 */
export async function archivePhotos(
  folder: string,
  id: string,
  photos: ParsedPhoto[],
  previous?: ParsedPhoto[],
  allowedHosts?: string[],
): Promise<ParsedPhoto[]> {
  const prevByUrl = new Map((previous ?? []).filter((p) => p.key).map((p) => [p.url, p]));
  const out: ParsedPhoto[] = [];
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const prev = prevByUrl.get(photo.url);
    if (prev?.key && prev.key === photoKeyAt(prev.key, folder, id, i)) {
      out.push({ ...photo, key: prev.key });
      continue;
    }
    if (i >= MAX_PHOTOS) {
      out.push({ url: photo.url, caption: photo.caption });
      continue;
    }
    const dl = await downloadPhoto(photo.url, allowedHosts);
    if (!dl) {
      out.push({ url: photo.url, caption: photo.caption });
      continue;
    }
    const key = photoKey(folder, id, i, dl.ext);
    try {
      await s3().send(
        new PutObjectCommand({ Bucket: bucket(), Key: key, Body: dl.data, ContentType: dl.ext === "jpg" ? "image/jpeg" : `image/${dl.ext}` }),
      );
      out.push({ url: photo.url, caption: photo.caption, key });
    } catch {
      out.push({ url: photo.url, caption: photo.caption });
    }
  }
  return out;
}

function photoKeyAt(key: string, folder: string, id: string, index: number): string {
  return key.startsWith(`photos/${folder}/${id.toLowerCase()}/${index}.`) ? key : "";
}
