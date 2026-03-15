import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
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

    // Fallbacks for Amazon specific structures
    if (!title) {
      title = $('#productTitle').text().trim();
    }
    if (!image) {
      image = $('#landingImage').attr('src') || '';
    }

    return NextResponse.json({ title, image });
  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json({ title: '', image: '', error: error.message }, { status: 500 });
  }
}
