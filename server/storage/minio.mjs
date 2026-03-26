import { S3Client, CreateBucketCommand, HeadBucketCommand, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { stat, unlink } from 'node:fs/promises'
import { basename, extname } from 'node:path'

export const createMinio = (config) => {
  if (!config.minio.enabled) return { s3: null }

  const endpoint = config.minio.endpoint
  const s3 = new S3Client({
    endpoint,
    region: config.minio.region,
    credentials: {
      accessKeyId: config.minio.accessKeyId,
      secretAccessKey: config.minio.secretAccessKey
    },
    forcePathStyle: true
  })

  return { s3 }
}

export const ensureBucket = async (s3, bucket) => {
  if (!s3) return
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }))
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }))
  }
}

export const sha256File = async (filePath) => {
  const hash = createHash('sha256')
  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', resolve)
  })
  return hash.digest('hex')
}

export const putObjectFromFile = async ({ s3, bucket, filePath, objectKey, mimeType }) => {
  if (!s3) throw new Error('minio disabled')
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: createReadStream(filePath),
      ContentType: mimeType
    })
  )
}

export const deleteObject = async ({ s3, bucket, objectKey }) => {
  if (!s3) return
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }))
}

export const presignGetObjectUrl = async ({ s3, bucket, objectKey, expiresSeconds, publicBaseUrl }) => {
  if (!s3) throw new Error('minio disabled')
  if (publicBaseUrl) {
    const base = publicBaseUrl.replace(/\/+$/, '')
    const key = String(objectKey).replace(/^\/+/, '')
    return `${base}/${bucket}/${key}`
  }

  const cmd = new GetObjectCommand({ Bucket: bucket, Key: objectKey })
  return getSignedUrl(s3, cmd, { expiresIn: expiresSeconds })
}

export const getObjectStream = async ({ s3, bucket, objectKey }) => {
  if (!s3) throw new Error('minio disabled')
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: objectKey })
  const res = await s3.send(cmd)
  return res?.Body || null
}

export const buildObjectKey = ({ sha256, originalName }) => {
  const ext = extname(basename(originalName || '')).toLowerCase()
  return ext ? `${sha256}${ext}` : sha256
}

export const cleanupTempFile = async (filePath) => {
  if (!filePath) return
  await unlink(filePath).catch(() => {})
}

export const fileSize = async (filePath) => {
  const st = await stat(filePath)
  return Number(st.size)
}
