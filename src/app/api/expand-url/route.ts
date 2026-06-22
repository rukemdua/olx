import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url || (!url.includes('goo.gl') && !url.includes('maps.app.goo.gl'))) {
      return NextResponse.json({ error: 'Bukan link pendek Google Maps' }, { status: 400 });
    }

    // Ambil URL tujuan (follow redirect)
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const finalUrl = response.url;
    const htmlBody = await response.text();
    
    // Kadang Google tidak meredirect secara HTTP 301, tapi menggunakan <meta http-equiv="refresh"> 
    // atau sekadar menampilkan halaman HTML yang memuat meta tags. 
    // Jadi kita kirimkan `finalUrl` dan potongan `htmlBody` ke client untuk diparsing.
    
    // Kita ekstrak URL panjang dari HTML jika finalUrl belum berubah dari shortlink
    let expandedUrl = finalUrl;
    
    // Cari URL panjang di tag meta
    const metaMatch = htmlBody.match(/<meta property="og:url" content="([^"]+)"/);
    if (metaMatch && metaMatch[1]) {
      expandedUrl = metaMatch[1];
    } else {
      // Jika tidak ada di og:url, cari pola koordinat langsung di dalam body
      // Kembalikan seluruh body html agar regex di frontend bisa menemukannya
      expandedUrl = finalUrl + " " + htmlBody;
    }

    return NextResponse.json({ expandedUrl: expandedUrl });
  } catch (error) {
    console.error('Error expanding URL:', error);
    return NextResponse.json({ error: 'Gagal memproses link' }, { status: 500 });
  }
}
