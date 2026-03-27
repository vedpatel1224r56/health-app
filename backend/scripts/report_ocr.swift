import Foundation
import Vision
import AppKit
import PDFKit
import CoreGraphics
import ImageIO

func printJson(_ payload: [String: Any]) {
  if let data = try? JSONSerialization.data(withJSONObject: payload, options: []),
     let text = String(data: data, encoding: .utf8) {
    FileHandle.standardOutput.write(text.data(using: .utf8)!)
  } else {
    FileHandle.standardOutput.write("{\"error\":\"Unable to serialize OCR response.\"}".data(using: .utf8)!)
  }
}

func recognizeText(from cgImage: CGImage) -> String {
  let request = VNRecognizeTextRequest()
  request.recognitionLevel = .accurate
  request.usesLanguageCorrection = true
  let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
  do {
    try handler.perform([request])
    let observations = request.results ?? []
    return observations.compactMap { $0.topCandidates(1).first?.string }.joined(separator: "\n")
  } catch {
    return ""
  }
}

func cgImage(fromImageAt url: URL) -> CGImage? {
  guard let source = CGImageSourceCreateWithURL(url as CFURL, nil) else { return nil }
  return CGImageSourceCreateImageAtIndex(source, 0, nil)
}

func extractFromImage(url: URL) -> String {
  guard let cgImage = cgImage(fromImageAt: url) else { return "" }
  return recognizeText(from: cgImage)
}

func extractFromPdf(url: URL) -> String {
  guard let document = PDFDocument(url: url) else { return "" }
  var parts: [String] = []
  for index in 0..<document.pageCount {
    guard let page = document.page(at: index) else { continue }
    let embeddedText = page.string?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    if !embeddedText.isEmpty {
      parts.append(embeddedText)
      continue
    }

    let image = page.thumbnail(of: NSSize(width: 1800, height: 2400), for: .mediaBox)
    guard let tiff = image.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiff),
          let cgImage = bitmap.cgImage else {
      continue
    }
    let ocrText = recognizeText(from: cgImage).trimmingCharacters(in: .whitespacesAndNewlines)
    if !ocrText.isEmpty {
      parts.append(ocrText)
    }
  }
  return parts.joined(separator: "\n")
}

let args = CommandLine.arguments
guard args.count >= 2 else {
  printJson(["error": "Missing file path."])
  exit(1)
}

let filePath = args[1]
let mimetype = args.count >= 3 ? args[2] : ""
let url = URL(fileURLWithPath: filePath)
let text: String

if mimetype == "application/pdf" || url.pathExtension.lowercased() == "pdf" {
  text = extractFromPdf(url: url)
} else {
  text = extractFromImage(url: url)
}

printJson([
  "text": text,
  "length": text.count,
])
