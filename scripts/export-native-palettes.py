from pathlib import Path
src=Path('New Shader/WaveCore/WavePalette.swift').read_text().split('enum WavePaletteLibrary')[0]
src=src.replace('import SwiftUI','import AppKit').replace('import UIKit','')
for marker in ['    static func generated(from artwork:', '    private static func representativeArtworkColor(', '    private static func isUsableArtworkColor(', '    func applied(to appearance:']:
 a=src.index(marker);b=src.index('{',a);depth=1;i=b+1
 while depth:
  if src[i]=='{':depth+=1
  if src[i]=='}':depth-=1
  i+=1
 src=src[:a]+src[i:]
header='''
import AppKit
struct Color {
 let ns: NSColor
 var hsba:(hue:Double,saturation:Double,brightness:Double,alpha:Double){let c=ns.usingColorSpace(.deviceRGB)!;return(c.hueComponent,c.saturationComponent,c.brightnessComponent,c.alphaComponent)}
 var hex:String{let c=ns.usingColorSpace(.deviceRGB)!;return String(format:"#%02X%02X%02X",Int((c.redComponent*255).rounded()),Int((c.greenComponent*255).rounded()),Int((c.blueComponent*255).rounded()))}
 init(hue:Double,saturation:Double,brightness:Double){ns=NSColor(deviceHue:hue,saturation:saturation,brightness:brightness,alpha:1)}
 init(hex:String){let x=Int(hex.replacingOccurrences(of:"#",with:""),radix:16)!;ns=NSColor(deviceRed:Double((x>>16)&255)/255,green:Double((x>>8)&255)/255,blue:Double(x&255)/255,alpha:1)}
 init(ns:NSColor){self.ns=ns}
}
'''
footer='''
func representative(_ file:String)->Color {
 let image=NSImage(contentsOfFile:file)!
 let cg=image.cgImage(forProposedRect:nil,context:nil,hints:nil)!
 var pixels=[UInt8](repeating:0,count:48*48*4)
 let context=CGContext(data:&pixels,width:48,height:48,bitsPerComponent:8,bytesPerRow:48*4,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
 context.interpolationQuality = .medium
 context.draw(cg,in:CGRect(x:0,y:0,width:48,height:48))
 var buckets:[Int:[Int]]=[:]
 for i in stride(from:0,to:pixels.count,by:4){if pixels[i+3]<=24{continue};let r=Int(pixels[i]),g=Int(pixels[i+1]),b=Int(pixels[i+2]);let key=(r/32)<<10|(g/32)<<5|(b/32);let old=buckets[key] ?? [0,0,0,0];buckets[key]=[old[0]+1,old[1]+r,old[2]+g,old[3]+b]}
 let colors=buckets.values.sorted{$0[0]>$1[0]}.prefix(5).map{a in Color(ns:NSColor(deviceRed:Double(a[1])/Double(a[0])/255,green:Double(a[2])/Double(a[0])/255,blue:Double(a[3])/Double(a[0])/255,alpha:1))}
 return colors.first{c in let h=c.hsba;let s=h.saturation*100,b=h.brightness*100;return s>=20 && b>=20 && (s-20)*(b-20)>=200} ?? colors.first!
}
let covers=["markul":"1c662dc779cd12974a28eadce7a01dd0.jpg","billie-rilish":"bill.jpeg","indie-louder":"8765433567.png","favorite":"дщму.png","justice":"neverender.jpg","mimic":"drug.jpeg"]
var result:[String:[String:String]]=[:]
for id in ["my-flow","ready-flow-indie","flow-electro","flow-hiphop"]+Array(covers.keys){
 let p:WavePalette
 if id=="my-flow" {p = .brand}
 else if let file=covers[id]{p=WavePalette.generated(from:representative("New Shader/Covers/"+file))}
 else {p=WavePalette.generated(from:Color(hex:id=="ready-flow-indie" ? "#434DD0" : id=="flow-electro" ? "#683ABC":"#F8682A"))}
 result[id]=["backgroundDark":p.backgroundDark.hex,"backgroundShade":p.backgroundShade.hex,"background":p.background.hex,"wavePause":p.wavePause.hex,"wavePlay":p.wavePlay.hex,"surfaceAccent":p.surfaceAccent.hex,"glowAccent":p.glowAccent.hex]
}
let data=try! JSONSerialization.data(withJSONObject:result,options:[.sortedKeys,.prettyPrinted]);try! data.write(to:URL(fileURLWithPath:"web/src/palettes.json"))
'''
Path('/tmp/companion-palette-export.swift').write_text(header+src+footer)
