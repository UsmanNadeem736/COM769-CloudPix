import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'

export default function UploadZone({ onFile }) {
  const { addToast } = useApp()
  const [preview, setPreview] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { addToast('Please select an image file', 'error'); return }
    const reader = new FileReader()
    reader.onload = e => { setPreview(e.target.result); onFile?.(file, e.target.result) }
    reader.readAsDataURL(file)
  }

  const remove = (e) => {
    e.stopPropagation()
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
    onFile?.(null, null)
  }

  if (preview) {
    return (
      <div className="upload-preview">
        <img src={preview} alt="Preview" />
        <button type="button" className="upload-preview-remove" onClick={remove}>×</button>
      </div>
    )
  }

  return (
    <div
      className={`upload-zone ${dragging ? 'dragover' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display:'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />
      <div className="upload-icon">🖼</div>
      <div className="upload-title">Drop your photo here</div>
      <div className="upload-sub">or click to browse files</div>
    </div>
  )
}
