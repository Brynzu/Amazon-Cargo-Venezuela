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

    // Resolve shortened links (like a.co or amzn.to)
    let finalUrl = url;
    if (url.includes('a.co') || url.includes('amzn.to')) {
      try {
        const preflight = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        finalUrl = preflight.url;
      } catch (e) {
        console.warn('Could not resolve shortened URL, proceeding with original');
      }
    }

    // Attempt to fetch the URL using a standard User-Agent to avoid immediate blocking
    const response = await fetch(finalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    // We don't strictly throw on !response.ok for Amazon because sometimes a 503 still returns the title/html
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

    // Attempt to scrape Amazon price, prioritizing the actual 'buy box' price within the center column
    // This prevents scraping prices from "Sponsored" carousels or "Customers also bought"
    let rawPrice = '';

    const centerCol = $('#centerCol, #corePrice_desktop, #desktop_buybox');

    // Sometimes the DOM renders corePriceDisplay_desktop_feature_div but empty, so we must check text length
    const desktopWhole = centerCol.find('#corePriceDisplay_desktop_feature_div .a-price-whole').first().text().trim();
    const desktopFraction = centerCol.find('#corePriceDisplay_desktop_feature_div .a-price-fraction').first().text().trim();

    const genericWhole = centerCol.find('.a-price-whole').first().text().trim();
    const genericFraction = centerCol.find('.a-price-fraction').first().text().trim();

    // 1. Try Desktop Buy Box Price First (Most accurate for active price)
    if (desktopWhole) {
      rawPrice = desktopWhole + '.' + desktopFraction;
    }
    // 2. Try Generic Buy Box Price scoped to center column
    else if (genericWhole) {
      rawPrice = genericWhole + '.' + genericFraction;
    }
    // 3. Fallback Selectors scoped to center column (Offscreen text, legacy blocks, kindle prices)
    else {
      rawPrice = centerCol.find('#corePrice_feature_div .a-offscreen').first().text() ||
                 centerCol.find('.a-price .a-offscreen').first().text() ||
                 $('#priceblock_ourprice').text() || // ID selectors are globally unique usually
                 $('#priceblock_dealprice').text() ||
                 $('#kindle-price').text() ||
                 centerCol.find('.a-color-price').first().text();
    }

    if (rawPrice && rawPrice !== '.') {
      // Extract numeric value from string like "$19.99", "$1,099.00", or "19.99"
      // Remove all commas first, then match digits and optional decimals
      const cleanString = rawPrice.replace(/,/g, '');
      const priceMatch = cleanString.match(/\d+(?:\.\d+)?/);

      if (priceMatch) {
        const parsed = parseFloat(priceMatch[0]);
        if (!isNaN(parsed) && parsed > 0) {
          price = parsed.toFixed(2);
        }
      }
    }

    // Ultimate fallback for Amazon URLs since they block basic fetch requests
    if (finalUrl.includes('amazon') && (!title || title.includes('Amazon.com') || title.includes('Amazon.es') || !image || !price)) {
      // Look for a 10-character alphanumeric ASIN
      const match = finalUrl.match(/(?:\/dp\/|\/product\/|\/asin\/|\/aw\/d\/|asin=)([A-Z0-9]{10})(?:[/?]|$)/i) || finalUrl.match(/\/([A-Z0-9]{10})(?:[/?]|$)/i);

      if (match && match[1]) {
        const asin = match[1].toUpperCase();
        if (!image) {
          // Fallback image using Amazon AdSystem
          image = `https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&Format=_SL250_&ASIN=${asin}&MarketPlace=US&ID=AsinImage&WS=1&ServiceVersion=20070822`;
        }
        if (!title || title.includes('Amazon')) {
          // Try to extract product name from URL slug
          const slugMatch = finalUrl.match(/amazon\.[a-z.]+\/(.*?)\/(?:dp|product)\//);
          if (slugMatch && slugMatch[1]) {
            title = decodeURIComponent(slugMatch[1]).replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
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
