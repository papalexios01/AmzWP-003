import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SearchRequest {
  query?: string;
  asin?: string;
  apiKey: string;
  type: 'search' | 'product';
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { query, asin, apiKey, type }: SearchRequest = await req.json();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let serpApiUrl: string;

    if (type === 'product' && asin) {
      serpApiUrl = `https://serpapi.com/search.json?engine=amazon_product&asin=${encodeURIComponent(asin)}&amazon_domain=amazon.com&api_key=${encodeURIComponent(apiKey)}`;
    } else if (type === 'search' && query) {
      serpApiUrl = `https://serpapi.com/search.json?engine=amazon&amazon_domain=amazon.com&k=${encodeURIComponent(query)}&api_key=${encodeURIComponent(apiKey)}`;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid request - provide query or asin" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[SerpAPI Proxy] ${type} request for:`, query || asin);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(serpApiUrl, {
      headers: { "Accept": "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SerpAPI Proxy] API error: ${response.status}`, errorText.substring(0, 200));

      let errorMessage = `SerpAPI returned ${response.status}`;
      if (response.status === 401) errorMessage = 'Invalid SerpAPI key';
      else if (response.status === 429) errorMessage = 'SerpAPI rate limit exceeded';
      else if (response.status === 400) errorMessage = 'Invalid request to SerpAPI';

      return new Response(
        JSON.stringify({ error: errorMessage, status: response.status }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();

    if (type === 'product') {
      const pr = data.product_results || data.product_result;
      if (pr) {
        console.log(`[SerpAPI Proxy] Product: "${pr.title?.substring(0, 50)}"`);
        console.log(`[SerpAPI Proxy] Image: ${pr.main_image ? 'YES' : 'NO'}, Images: ${pr.images?.length || 0}`);
        console.log(`[SerpAPI Proxy] Price: ${pr.buybox_winner?.price?.raw || pr.price?.raw || 'N/A'}`);
        console.log(`[SerpAPI Proxy] Rating: ${pr.rating || 'N/A'}, Reviews: ${pr.reviews_total || pr.ratings_total || 'N/A'}`);
        console.log(`[SerpAPI Proxy] Bullets: ${pr.feature_bullets?.length || 0}, Specs: ${Object.keys(pr.specifications_flat || {}).length}`);
      } else {
        console.error(`[SerpAPI Proxy] No product data found. Keys: ${Object.keys(data).join(', ')}`);
      }
    } else {
      console.log(`[SerpAPI Proxy] Search: ${data.organic_results?.length || 0} results`);
    }

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("[SerpAPI Proxy] Error:", error.message);
    const isTimeout = error.name === 'AbortError';
    return new Response(
      JSON.stringify({ error: isTimeout ? "Request timed out - try again" : (error.message || "Internal server error") }),
      {
        status: isTimeout ? 504 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
