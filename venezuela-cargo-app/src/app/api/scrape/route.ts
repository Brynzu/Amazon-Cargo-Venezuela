import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Basic SSRF prevention: ensure URL is HTTP/HTTPS
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
    }

    // Attempt to fetch the URL using a standard User-Agent to avoid immediate blocking
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Common metadata tags
    let title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    let image = $('meta[property="og:image"]').attr('content') || '';
    let price = '';

    // Fallbacks for Amazon specific structures
    if (!title || title.includes("Amazon.com")) {
      title = $('#productTitle').text().trim();
    }
    if (!image) {
      image = $('#landingImage').attr('src') || '';
    }

    // Attempt to scrape Amazon price
    const rawPrice = $('.a-price .a-offscreen').first().text() ||
                     $('#corePrice_feature_div .a-offscreen').first().text() ||
                     $('#priceblock_ourprice').text() ||
                     $('#priceblock_dealprice').text();

    if (rawPrice) {
      // Extract numeric value from string like "$19.99"
      const priceMatch = rawPrice.match(/[\d,]+(?:\.\d+)?/);
      if (priceMatch) {
        price = priceMatch[0].replace(/,/g, '');
      }
    }

    // Ultimate fallback for Amazon URLs since they block basic fetch requests
    if (url.includes('amazon.com') && (!title || title.includes('Amazon.com') || !image || !price)) {
      const match = url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/);
      if (match && match[1]) {
        const asin = match[1];
        if (!image) {
          image = `https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&Format=_SL250_&ASIN=${asin}&MarketPlace=US&ID=AsinImage&WS=1&ServiceVersion=20070822`;
        }
        if (!title || title.includes('Amazon.com')) {
          // Try to extract product name from URL slug
          const slugMatch = url.match(/amazon\.com\/(.*?)\/dp\//);
          if (slugMatch && slugMatch[1]) {
            title = slugMatch[1].replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
          } else {
            title = `Amazon Product (ASIN: ${asin})`;
          }
        }
      }
    }

    return NextResponse.json({ title, image, price });
  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json({ title: '', image: '', price: '', error: error.message }, { status: 500 });
  }
}
