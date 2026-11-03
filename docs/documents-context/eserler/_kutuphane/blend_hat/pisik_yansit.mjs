// Üstten ve cepheden görülen texelleri, ACES öncesi sunum renginden örnekle.
// Görünmeyen yüzlerde Cycles pişirmesi ve mahya alfa kanalı korunur.
import fs from 'node:fs';

export function atlasOku(file) {
  const glb = fs.readFileSync(file);
  const end = 20 + glb.readUInt32LE(12);
  const json = JSON.parse(glb.subarray(20, end));
  const mat = json.materials.find(m => m.name === 'Harita_Pisik');
  const tex = json.textures[mat.pbrMetallicRoughness.baseColorTexture.index];
  const view = json.images[tex.extensions?.EXT_texture_webp?.source ?? tex.source].bufferView;
  return {json, view, bin: glb.subarray(end + 8)};
}

export function atlasYaz(file, {json, view, bin}, image) {
  const old = json.bufferViews[view];
  const start = old.byteOffset || 0;
  const pad = n => Math.ceil(n / 4) * 4;
  const end = start + pad(old.byteLength);
  const data = Buffer.concat([bin.subarray(0,start), image, Buffer.alloc(pad(image.length)-image.length), bin.subarray(end)]);
  for (const v of json.bufferViews) if (v.byteOffset >= end) v.byteOffset += pad(image.length) - pad(old.byteLength);
  old.byteLength = image.length;
  json.buffers[0].byteLength = data.length;
  const j = Buffer.from(JSON.stringify(json));
  const hdr = Buffer.alloc(20); hdr.write('glTF'); hdr.writeUInt32LE(2,4);
  hdr.writeUInt32LE(28 + pad(j.length) + data.length,8); hdr.writeUInt32LE(pad(j.length),12); hdr.write('JSON',16);
  const b = Buffer.alloc(8); b.writeUInt32LE(data.length); b.write('BIN',4);
  fs.writeFileSync(file, Buffer.concat([hdr,j,Buffer.alloc(pad(j.length)-j.length,32),b,data]));
}

export async function yansit({file, render, sharp, limit, az, ortam}) {
  const atlas = atlasOku(file);
  const mat = atlas.json.materials.find(m => m.name === 'Harita_Pisik');
  if (mat.alphaMode === 'MASK') mat.alphaCutoff = .2;
  const v = atlas.json.bufferViews[atlas.view], start = v.byteOffset || 0;
  const base = await sharp(atlas.bin.subarray(start,start+v.byteLength)).ensureAlpha().raw().toBuffer();
  const n = 2048*2048, sums = new Float32Array(3*n), weights = new Float32Array(n);
  for (const [tilt, count, close, anaBakis] of [[55,8,false],[20,8,false],[82,1,false],[50,6,true],[80,1,true],[45,1,true,true]]) {
    for (let i=0; i<count; i++) {
      const camera = {kamAz: anaBakis ? az : i*360/count+13, kamEgim: tilt, yakin: close, iskeletsiz: !!anaBakis};
      const uv = await render(camera,true), rgb = await render(camera,false);
      const stride = 1600*3;
      for (let p=stride+3; p<uv.length-stride-3; p+=3) {
        if (uv[p+2]>63) continue;
        // Örtüşme ve silüet sınırında karışmış örnekleri ayıkla.
        if ([p-3,p+3,p-stride,p+stride].some(q => uv[q+2]>63 || Math.abs(uv[q]-uv[p])+Math.abs(uv[q+1]-uv[p+1])>5)) continue;
        const x=8*uv[p]+(uv[p+2]%8), y=8*uv[p+1]+Math.floor(uv[p+2]/8);
        const k=y*2048+x;
        const w = anaBakis ? 32 : 1;
        weights[k]+=w;
        for(let c=0;c<3;c++) sums[3*k+c]+=w*rgb[p+c];
      }
    }
  }
  let ortamOlcum = null;
  if (ortam && fs.existsSync(ortam)) {
    const zero = await sharp(ortam).ensureAlpha().raw().toBuffer();
    const linear = x => x <= .04045 ? x/12.92 : ((x+.055)/1.055)**2.4;
    const srgb = x => x <= .0031308 ? 12.92*x : 1.055*x**(1/2.4)-.055;
    const L = (a,k) => .2126*linear(a[k]/255)+.7152*linear(a[k+1]/255)+.0722*linear(a[k+2]/255);
    const errors = Array(11).fill(0);
    let count = 0;
    for(let k=0;k<n;k++) {
      if(weights[k]<3) continue;
      const a=L(zero,4*k), b=L(base,4*k);
      if(Math.abs(a-b)<.01) continue;
      const p=3*k, scale=255*weights[k];
      const target=.2126*linear(sums[p]/scale)+.7152*linear(sums[p+1]/scale)+.0722*linear(sums[p+2]/scale);
      for(let i=0;i<=10;i++) errors[i]+=Math.abs(a+(b-a)*i/10-target);
      count++;
    }
    const w=errors.indexOf(Math.min(...errors))/10;
    ortamOlcum={ORTAM_YUMUSAT:w,texel:count, dogrusal_parlaklik_mutlak_hata:errors.map(e=>e/count)};
    for(let k=0;k<n;k++) for(let c=0;c<3;c++) {
      const j=4*k+c;
      base[j]=Math.round(255*srgb((1-w)*linear(zero[j]/255)+w*linear(base[j]/255)));
    }
  }
  // İki piksellik taşırma ve örnekler arasındaki küçük boşluklar.
  for (let pass=0;pass<3;pass++) {
    const before=weights.slice();
    for(let k=2049;k<n-2049;k++) {
      if(before[k]) continue;
      for(const j of [k-1,k+1,k-2048,k+2048]) {
        if(!before[j]) continue;
        weights[k]++;
        for(let c=0;c<3;c++) sums[3*k+c]+=sums[3*j+c]/before[j];
      }
    }
  }
  for(let k=0;k<n;k++) if(weights[k]) for(let c=0;c<3;c++) base[4*k+c]=Math.round(sums[3*k+c]/weights[k]);
  for(let quality=88;quality>=30;quality-=4) {
    const image=await sharp(base,{raw:{width:2048,height:2048,channels:4}}).webp({quality,alphaQuality:100}).toBuffer();
    if(fs.statSync(file).size-v.byteLength+image.length<=limit || quality===32) {
      atlasYaz(file,atlas,image); return {quality, ortam_olcum:ortamOlcum, orneklenen_texel: weights.reduce((n,w)=>n+(w>0),0)};
    }
  }
}

// Mip filtrelemesinden sonra ince ek ve kafeslerin kaybettiği karşıtlığı ölç.
// Her texel için farklı yönlerden görülen renk hatasının ortalamasını geri ekle.
export async function inceAyar({file,render,sharp,az,limit}) {
  const atlas=atlasOku(file);
  const mat=atlas.json.materials.find(m=>m.name==='Harita_Pisik');
  mat.alphaCutoff=.2;
  const view=atlas.json.bufferViews[atlas.view];
  const base=await sharp(atlas.bin.subarray(view.byteOffset,view.byteOffset+view.byteLength)).ensureAlpha().raw().toBuffer();
  const n=2048**2, err=new Float32Array(3*n), weights=new Float32Array(n);
  for (const [egim,sayi,yakin] of [[40,8,false],[55,4,false],[45,1,true]]) {
    for(let i=0;i<sayi;i++) {
      const camera={kamAz:az+i*360/sayi,kamEgim:egim,yakin};
      const uv=await render(camera,'uv'), src=await render(camera,'sunum'), dst=await render(camera,'pisik');
      for(let j=0;j<uv.length;j+=3) {
        if(uv[j+2]>63) continue;
        const k=(8*uv[j+1]+(uv[j+2]>>3))*2048+8*uv[j]+(uv[j+2]&7);
        const w=yakin?5:1;
        weights[k]+=w;
        for(let c=0;c<3;c++) err[3*k+c]+=w*(src[j+c]-dst[j+c]);
      }
    }
  }
  for(let k=0;k<n;k++) if(weights[k]) for(let c=0;c<3;c++) {
    const delta = Math.max(-32,Math.min(32,err[3*k+c]/weights[k]));
    base[4*k+c]=Math.min(255,Math.max(0,Math.round(base[4*k+c]+1.2*delta)));
  }
  for(let quality=92;quality>=32;quality-=4) {
    const img=await sharp(base,{raw:{width:2048,height:2048,channels:4}}).webp({quality,alphaQuality:100}).toBuffer();
    if(fs.statSync(file).size-view.byteLength+img.length<=limit || quality===32) {
      atlasYaz(file,atlas,img);
      return {quality, mahya_esigi:mat.alphaCutoff};
    }
  }
}

// 4 Kasım 2026, dördüncü deneme: mevcut harita dosyasından yoğun yansıtma (pisik_gorsel.html window.yansitAtlas).
// Örneklenen texel yeni rengi alır; ada içinde örneği olmayan texel önce en çok 16 adım komşu örnekten (Cycles dar yerlerde koyu), kalırsa önceki atlastan;
// ada dışı (kenar payı, boşluk) piramit taşırmasıyla en yakın ada rengini alır: mip düzeylerinde komşu adanın ya da siyahın rengi karışmaz.
// Alfa (gece: mahya yazısı) önceki atlastan. WebP kalitesi, dosya sınırına sığan en yüksek değer.
// Bakış ağırlığı: güneşi arkasına alan yönler önde (uygulama güneşi ön cepheye ön-sol çaprazdan, bakanın arkasından vurdurur);
// güneşe karşı bakışların görünüşe bağlı parlaması ortalamayı açmasın: ağırlık × (0,25 + 0,75 · max(0, cos(az − güneş az))).
export const bakislar = gunesAz => {
  const k = az => 0.25 + 0.75 * Math.max(0, Math.cos((az - gunesAz) * Math.PI / 180));
  return [
    ...Array.from({length: 12}, (_, i) => [i * 30 + 6, 30, 3]),   // uygulama kamerası: eğim 60° (30° yükseklik), her yön
    ...Array.from({length: 8}, (_, i) => [i * 45 + 28, 12, 1]),   // alçak: girintiler, basamaklar, alt pencereler
    ...Array.from({length: 8}, (_, i) => [i * 45 + 6, 55, 1]),    // çatı ve kubbe yamaçları
    [0, 88, 1],                                                   // tepeden
  ].map(([az, el, w]) => [az, el, +(w * (el > 85 ? 1 : k(az))).toFixed(3)]);
};
export async function yansitUygulama({file, render, sharp, limit, sinirYok = false, komsuAdim = 16, mahya = null, maskeEsik = 0.2}) {
  const atlas = atlasOku(file);
  const mat = atlas.json.materials.find(m => m.name === 'Harita_Pisik');
  if (mat.alphaMode === 'MASK') mat.alphaCutoff = maskeEsik;   // gece: mahya yazısı; 0,2 / 0,27 / 0,35 / 0,45 / 0,5 ölçüldü (4 Kasım 2026); 0,2 (deneme 3 ile aynı)
  const v = atlas.json.bufferViews[atlas.view], start = v.byteOffset || 0, N = 2048, n = N * N;
  const base = await sharp(atlas.bin.subarray(start, start + v.byteLength)).ensureAlpha().raw().toBuffer();
  const r = await render();
  const dec = async u => sharp(Buffer.from(u.split(',')[1], 'base64')).ensureAlpha().raw().toBuffer();
  const rgb = await dec(r.rgb), bay = await dec(r.bayrak);
  const val = new Float32Array(3 * n), dur = new Uint8Array(n);   // dur: 2 örnek, 3 korunur (Mahya: önceki atlas), 1 ada içi (doldurulacak), 0 boş
  let korunan = 0;
  for (let k = 0; k < n; k++) { const f = bay[4 * k]; dur[k] = f > 200 ? 2 : f > 100 ? 3 : f > 32 ? 1 : 0;
    if (dur[k] === 2) for (let c = 0; c < 3; c++) val[3 * k + c] = rgb[4 * k + c];
    if (dur[k] === 3) { for (let c = 0; c < 3; c++) val[3 * k + c] = base[4 * k + c]; korunan++; } }
  let komsu = 0;
  for (let gecis = 0; gecis < komsuAdim; gecis++) {
    const yeni = [];
    for (let k = 0; k < n; k++) { if (dur[k] !== 1) continue; const x = k % N; let s0 = 0, s1 = 0, s2 = 0, c = 0;
      for (const j of [x > 0 ? k - 1 : -1, x < N - 1 ? k + 1 : -1, k - N, k + N]) if (j >= 0 && j < n && dur[j] === 2) { s0 += val[3 * j]; s1 += val[3 * j + 1]; s2 += val[3 * j + 2]; c++; }
      if (c) yeni.push([k, s0 / c, s1 / c, s2 / c]); }
    for (const [k, a, b, c] of yeni) { val[3 * k] = a; val[3 * k + 1] = b; val[3 * k + 2] = c; dur[k] = 2; komsu++; }
  }
  let onceki = 0;
  for (let k = 0; k < n; k++) if (dur[k] === 1) { for (let c = 0; c < 3; c++) val[3 * k + c] = base[4 * k + c]; dur[k] = 2; onceki++; }
  // piramit taşırma (push-pull)
  for (let k = 0; k < n; k++) if (dur[k] === 3) dur[k] = 2;
  const seviye = [{ v: val, w: Float32Array.from(dur, d => d === 2 ? 1 : 0), N }];
  while (seviye.at(-1).N > 1) { const { v: a, w: aw, N: M } = seviye.at(-1), H = M / 2, b = new Float32Array(3 * H * H), bw = new Float32Array(H * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < H; x++) { const o = y * H + x;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const j = (2 * y + dy) * M + 2 * x + dx; if (!aw[j]) continue; bw[o] += aw[j]; for (let c = 0; c < 3; c++) b[3 * o + c] += aw[j] * a[3 * j + c]; }
      if (bw[o]) for (let c = 0; c < 3; c++) b[3 * o + c] /= bw[o]; }
    seviye.push({ v: b, w: bw, N: H }); }
  for (let l = seviye.length - 2; l >= 0; l--) { const { v: a, w: aw, N: M } = seviye[l], { v: b, N: H } = seviye[l + 1];
    for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) { const o = y * M + x; if (aw[o]) continue; const p = (y >> 1) * H + (x >> 1); for (let c = 0; c < 3; c++) a[3 * o + c] = b[3 * p + c]; aw[o] = 1e-6; } }
  for (let k = 0; k < n; k++) for (let c = 0; c < 3; c++) base[4 * k + c] = Math.round(val[3 * k + c]);
  // gece mahyası: mevcut dosyanın dokusundan aktarılmış renk ve alfa (pisik_gorsel.html mahyaAktar); yalnız korunan (Mahya) texeller
  let mahyaTexel = 0, mahyaYansi = 0;
  if (mahya) {
    const mr = await dec(mahya.rgb), ma = await dec(mahya.alfa);
    for (let k = 0; k < n; k++) { if (bay[4 * k] <= 100 || bay[4 * k] > 200) continue;
      base[4 * k + 3] = ma[4 * k];
      if (bay[4 * k] > 140) { for (let c = 0; c < 3; c++) base[4 * k + c] = rgb[4 * k + c]; mahyaYansi++; }   // yansıtılmış karışık renk (hale)
      else if (ma[4 * k] > 0) { for (let c = 0; c < 3; c++) base[4 * k + c] = mr[4 * k + c]; mahyaTexel++; } }
  }
  let secilen = null;
  for (let quality = 92; quality >= 30; quality -= 2) {
    const image = await sharp(base, {raw: {width: N, height: N, channels: 4}}).webp({quality, alphaQuality: 100, smartSubsample: true}).toBuffer();
    if (sinirYok || fs.statSync(file).size - v.byteLength + image.length <= limit || quality <= 30) { atlasYaz(file, atlas, image); secilen = quality; break; }
  }
  return {quality: secilen, doseme: r.doseme, alinan_piksel: r.alinan_piksel, orneklenen_texel: r.orneklenen_texel, ada_komsudan: komsu, ada_onceki_atlastan: onceki, korunan_mahya: korunan, mahya_aktarilan: mahyaTexel, mahya_yansitilan: mahyaYansi, mahya_kose: mahya && {kose: mahya.kose, eslesmeyen: mahya.eslesmeyen, en_uzak_m: mahya.en_uzak_m}, bayt: fs.statSync(file).size};
}
