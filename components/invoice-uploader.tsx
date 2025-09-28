"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, ImageIcon, CheckCircle, AlertCircle, Loader2, Eye } from "lucide-react"
import { InvoicePreview } from "./invoice-preview"
import type { ExtractedInvoiceData } from "@/lib/python-integration"

interface UploadedFile {
  file: File
  id: string
  status: "uploading" | "processing" | "completed" | "error"
  progress: number
  extractedData?: ExtractedInvoiceData
  filePath?: string
  error?: string
}

export function InvoiceUploader() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: "uploading",
      progress: 0,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])

    // Process each file
    newFiles.forEach((uploadedFile) => {
      processFile(uploadedFile)
    })
  }, [])

  const processFile = async (uploadedFile: UploadedFile) => {
    try {
      // Update status to processing
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: "processing", progress: 50 } : f)),
      )

      const formData = new FormData()
      formData.append("file", uploadedFile.file)

      const response = await fetch("/api/invoices/extract", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? {
                  ...f,
                  status: "completed",
                  progress: 100,
                  extractedData: result.data,
                  filePath: result.file_path,
                }
              : f,
          ),
        )
      } else {
        throw new Error(result.error || "Extraction failed")
      }
    } catch (error) {
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? {
                ...f,
                status: "error",
                progress: 0,
                error: error instanceof Error ? error.message : "Unknown error",
              }
            : f,
        ),
      )
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".bmp", ".tiff"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const getFileIcon = (file: File) => {
    if (file.type === "application/pdf") {
      return <FileText className="w-8 h-8 text-red-500" />
    }
    return <ImageIcon className="w-8 h-8 text-blue-500" />
  }

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
      case "processing":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return <Badge variant="secondary">Uploading</Badge>
      case "processing":
        return <Badge variant="secondary">Processing</Badge>
      case "completed":
        return <Badge className="status-paid">Completed</Badge>
      case "error":
        return <Badge className="status-overdue">Error</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">Drag & drop invoice files here, or click to select</p>
                <p className="text-sm text-muted-foreground">Supports PDF, PNG, JPG, JPEG, BMP, TIFF (max 10MB)</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedFiles.map((uploadedFile) => (
                <div
                  key={uploadedFile.id}
                  className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  {getFileIcon(uploadedFile.file)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{uploadedFile.file.name}</p>
                      {getStatusIcon(uploadedFile.status)}
                    </div>

                    <div className="flex items-center gap-3">
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {getStatusBadge(uploadedFile.status)}
                    </div>

                    {(uploadedFile.status === "uploading" || uploadedFile.status === "processing") && (
                      <Progress value={uploadedFile.progress} className="mt-2" />
                    )}

                    {uploadedFile.error && (
                      <Alert className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{uploadedFile.error}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {uploadedFile.status === "completed" && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedFile(uploadedFile)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      {selectedFile && selectedFile.extractedData && (
        <InvoicePreview file={selectedFile} onClose={() => setSelectedFile(null)} />
      )}
    </div>
  )
}
