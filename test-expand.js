const url = 'https://maps.app.goo.gl/KCZR4ZPT5XxiyNC5A';

fetch(url, {
  method: 'GET',
  redirect: 'follow',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
  }
})
.then(async (res) => {
  console.log("FINAL URL:", res.url);
  const text = await res.text();
  console.log("BODY LENGTH:", text.length);
  
  // Test regexes
  const urlAtMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const urlQMatch = text.match(/[?&amp;]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  const urlLlMatch = text.match(/[?&amp;]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  const centerMatch = text.match(/center=(-?\d+\.\d+),(-?\d+\.\d+)/);
  const metaMatch = text.match(/<meta property="og:image" content="([^"]+)"/);
  const allCoords = text.match(/-?\d{1,2}\.\d{4,8},-?\d{1,3}\.\d{4,8}/g);

  console.log("urlAtMatch:", urlAtMatch ? urlAtMatch[0] : null);
  console.log("urlQMatch:", urlQMatch ? urlQMatch[0] : null);
  console.log("urlLlMatch:", urlLlMatch ? urlLlMatch[0] : null);
  console.log("centerMatch:", centerMatch ? centerMatch[0] : null);
  console.log("metaMatch:", metaMatch ? metaMatch[1] : null);
  console.log("allCoords:", allCoords);
})
.catch(err => console.error(err));
