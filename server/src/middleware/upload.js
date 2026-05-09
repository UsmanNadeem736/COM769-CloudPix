import multer from 'multer'
import { BlobServiceClient } from '@azure/storage-blob'
import { v4 as uuidv4 } from 'uuid'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 20 * 1024 * 1024 // 20 MB

export const multerMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter(req, file, cb) {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only JPG, PNG, WEBP and GIF images are allowed'))
  },
})

export async function uploadToAzure(file) {
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING
  const container = process.env.AZURE_STORAGE_CONTAINER || 'photos'

  if (!connStr) {
    // Dev fallback: return a placeholder picsum URL
    return { url: `https://picsum.photos/seed/${uuidv4().slice(0,8)}/600/800`, blobName: '' }
  }

  const client = BlobServiceClient.fromConnectionString(connStr)
  const containerClient = client.getContainerClient(container)
  await containerClient.createIfNotExists({ access: 'blob' })

  const ext = file.originalname.split('.').pop() || 'jpg'
  const blobName = `${uuidv4()}.${ext}`
  const blockBlob = containerClient.getBlockBlobClient(blobName)

  await blockBlob.upload(file.buffer, file.buffer.length, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  })

  return { url: blockBlob.url, blobName }
}

export async function deleteFromAzure(blobName) {
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING
  const container = process.env.AZURE_STORAGE_CONTAINER || 'photos'
  if (!connStr || !blobName) return
  const client = BlobServiceClient.fromConnectionString(connStr)
  await client.getContainerClient(container).deleteBlob(blobName)
}
