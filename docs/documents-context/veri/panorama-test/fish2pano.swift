import AppKit
let a = CommandLine.arguments
let src = NSBitmapImageRep(data: try! Data(contentsOf: URL(fileURLWithPath: a[1])))!
let W = src.pixelsWide, H = src.pixelsHigh
func px(_ x: Int, _ y: Int) -> (Double, Double, Double) {
  var p = [Int](repeating: 0, count: 4); src.getPixel(&p, atX: x, y: y); return (Double(p[0]), Double(p[1]), Double(p[2]))
}
// daire sınırı: parlaklığı eşiği aşan piksellerin kutusu
var minX = W, maxX = 0, minY = H, maxY = 0
for y in stride(from: 0, to: H, by: 2) { for x in stride(from: 0, to: W, by: 2) {
  let (r,g,b) = px(x,y); if (r+g+b)/3 > 28 { minX = min(minX,x); maxX = max(maxX,x); minY = min(minY,y); maxY = max(maxY,y) } } }
let cx = Double(minX+maxX)/2, cy = Double(minY+maxY)/2
let R = Double(min(maxX-minX, maxY-minY))/2 * 0.985
print("merkez", cx, cy, "yarıçap", R, "kutu", minX, maxX, minY, maxY)
let OW = 4096, OH = 2048
let out = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: OW, pixelsHigh: OH, bitsPerSample: 8, samplesPerPixel: 3, hasAlpha: false, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
let fov = Double(a[3]) ?? 180.0   // lens görüş açısı (derece)
for j in 0..<OH {
  let lat = (0.5 - (Double(j)+0.5)/Double(OH)) * Double.pi      // +90° üst = zirve
  let theta = Double.pi/2 - lat                                   // zirveden açı
  for i in 0..<OW {
    let lon = ((Double(i)+0.5)/Double(OW) - 0.5) * 2 * Double.pi
    var c: (Double,Double,Double) = (0,0,0)
    let thDeg = theta * 180 / Double.pi
    if thDeg <= fov/2 {
      let r = R * thDeg / (fov/2)
      let x = cx + r * cos(lon), y = cy - r * sin(lon)
      let x0 = Int(floor(x)), y0 = Int(floor(y))
      if x0 >= 0, y0 >= 0, x0+1 < W, y0+1 < H {
        let fx = x - Double(x0), fy = y - Double(y0)
        let p00 = px(x0,y0), p10 = px(x0+1,y0), p01 = px(x0,y0+1), p11 = px(x0+1,y0+1)
        func m(_ k: (Double,Double,Double)->Double) -> Double { k(p00.0,p00.1,p00.2)*(1-fx)*(1-fy) + k(p10.0,p10.1,p10.2)*fx*(1-fy) + k(p01.0,p01.1,p01.2)*(1-fx)*fy + k(p11.0,p11.1,p11.2)*fx*fy }
        c = (m{r,_,_ in r}, m{_,g,_ in g}, m{_,_,b in b})
      }
    }
    var q = [Int(c.0), Int(c.1), Int(c.2)]
    out.setPixel(&q, atX: i, y: j)
  }
}
try! out.representation(using: .jpeg, properties: [.compressionFactor: 0.9])!.write(to: URL(fileURLWithPath: a[2]))
print("ok")
