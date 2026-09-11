import Foundation
import AVFoundation
import CoreGraphics
import ImageIO

struct FrameOutput: Codable {
  let id: String
  let index: Int
  let timestamp: Double
  let dataUrl: String
  let width: Int
  let height: Int
}

func main() {
  let args = CommandLine.arguments
  guard args.count >= 2 else {
    fputs("Usage: extract-frames <video-path> [interval] [maxFrames] [maxWidth]\n", stderr)
    exit(1)
  }

  let videoPath = args[1]
  let interval = args.count >= 3 ? (Double(args[2]) ?? 0.15) : 0.15
  let maxFrames = args.count >= 4 ? (Int(args[3]) ?? 45) : 45
  let maxWidth = args.count >= 5 ? (Double(args[4]) ?? 1080) : 1080

  let videoUrl = URL(fileURLWithPath: videoPath)
  guard FileManager.default.fileExists(atPath: videoPath) else {
    fputs("Error: File does not exist at \(videoPath)\n", stderr)
    exit(1)
  }

  let asset = AVURLAsset(url: videoUrl)
  let duration = CMTimeGetSeconds(asset.duration)
  if duration <= 0 {
    fputs("Error: Invalid video duration\n", stderr)
    exit(1)
  }

  let generator = AVAssetImageGenerator(asset: asset)
  generator.appliesPreferredTrackTransform = true
  generator.requestedTimeToleranceBefore = CMTime(seconds: 0.05, preferredTimescale: 600)
  generator.requestedTimeToleranceAfter = CMTime(seconds: 0.05, preferredTimescale: 600)
  generator.maximumSize = CGSize(width: maxWidth, height: maxWidth)

  var timestamps: [Double] = []
  let naturalCount = Int(floor(duration / interval)) + 1

  if naturalCount <= maxFrames {
    for i in 0..<naturalCount {
      let t = min(duration, Double(i) * interval)
      timestamps.append((t * 1000).rounded() / 1000)
    }
  } else {
    let step = duration / Double(maxFrames - 1)
    for i in 0..<maxFrames {
      let t = min(duration, Double(i) * step)
      timestamps.append((t * 1000).rounded() / 1000)
    }
  }

  if timestamps.isEmpty {
    timestamps.append(0.0)
  }

  var results: [FrameOutput] = []

  for (index, timeSec) in timestamps.enumerated() {
    let cmTime = CMTime(seconds: timeSec, preferredTimescale: 600)
    do {
      let cgImage = try generator.copyCGImage(at: cmTime, actualTime: nil)
      let w = cgImage.width
      let h = cgImage.height

      // Convert CGImage to JPEG Data
      let mutableData = CFDataCreateMutable(kCFAllocatorDefault, 0)!
      guard let destination = CGImageDestinationCreateWithData(mutableData, "public.jpeg" as CFString, 1, nil) else {
        continue
      }
      let options: [CFString: Any] = [
        kCGImageDestinationLossyCompressionQuality: 0.96
      ]
      CGImageDestinationAddImage(destination, cgImage, options as CFDictionary)
      guard CGImageDestinationFinalize(destination) else {
        continue
      }

      let data = mutableData as Data
      let base64 = data.base64EncodedString()
      let dataUrl = "data:image/jpeg;base64,\(base64)"

      results.append(FrameOutput(
        id: "frame-\(index)-\(Int(Date().timeIntervalSince1970 * 1000))",
        index: index,
        timestamp: timeSec,
        dataUrl: dataUrl,
        width: w,
        height: h
      ))
    } catch {
      // Continue if a single frame fails
      fputs("Warning: Failed to extract frame at \(timeSec)s: \(error)\n", stderr)
    }
  }

  let encoder = JSONEncoder()
  do {
    let jsonData = try encoder.encode(results)
    if let jsonString = String(data: jsonData, encoding: .utf8) {
      print(jsonString)
    }
  } catch {
    fputs("Error encoding output JSON: \(error)\n", stderr)
    exit(1)
  }
}

main()
