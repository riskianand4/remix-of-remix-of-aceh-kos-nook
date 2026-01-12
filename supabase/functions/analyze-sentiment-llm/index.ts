const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SentimentResponse {
  sentiment: 'positif' | 'negatif' | 'netral';
  confidence: number;
  reasoning?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Teks diperlukan untuk analisis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI belum dikonfigurasi' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Truncate text if too long (max 3000 chars for efficiency)
    const truncatedText = text.slice(0, 3000);

    console.log('Analyzing sentiment with LLM, text length:', truncatedText.length);

    const systemPrompt = `Kamu adalah sistem klasifikasi sentimen berita Indonesia yang sangat akurat.

INSTRUKSI PENTING:
1. Analisis sentimen dari teks berita yang diberikan
2. Pertimbangkan konteks berita Indonesia, termasuk bahasa formal dan informal
3. Perhatikan sarkasme, sindiran, dan nuansa bahasa Indonesia
4. Fokus pada tone keseluruhan berita, bukan hanya kata-kata individual

KRITERIA KLASIFIKASI:
- POSITIF: Berita tentang prestasi, keberhasilan, kemajuan, hal baik, optimisme, solusi
- NEGATIF: Berita tentang masalah, kritik, kegagalan, bencana, konflik, pesimisme
- NETRAL: Berita informatif/faktual tanpa muatan emosional yang jelas, pengumuman biasa

RESPONS WAJIB dalam format JSON:
{"sentiment": "positif/negatif/netral", "confidence": 0.0-1.0, "reasoning": "penjelasan singkat 1 kalimat"}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analisis sentimen teks berita berikut:\n\n${truncatedText}` }
        ],
        temperature: 0.1, // Low temperature for consistent classification
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit tercapai, coba lagi nanti' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'Kredit AI habis, silakan top up' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Gagal menganalisis dengan AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';

    console.log('LLM raw response:', content);

    // Parse the JSON response from LLM
    let sentimentResult: SentimentResponse;
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        sentimentResult = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: detect sentiment from text
        const lowerContent = content.toLowerCase();
        let sentiment: 'positif' | 'negatif' | 'netral' = 'netral';
        
        if (lowerContent.includes('positif')) {
          sentiment = 'positif';
        } else if (lowerContent.includes('negatif')) {
          sentiment = 'negatif';
        }
        
        sentimentResult = {
          sentiment,
          confidence: 0.7,
          reasoning: 'Hasil parsing dari respons LLM'
        };
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response:', parseError);
      // Default fallback
      sentimentResult = {
        sentiment: 'netral',
        confidence: 0.5,
        reasoning: 'Gagal mem-parsing respons AI'
      };
    }

    // Validate and normalize the result
    const validSentiments = ['positif', 'negatif', 'netral'];
    if (!validSentiments.includes(sentimentResult.sentiment)) {
      sentimentResult.sentiment = 'netral';
    }
    
    // Ensure confidence is between 0 and 1
    sentimentResult.confidence = Math.max(0, Math.min(1, sentimentResult.confidence || 0.8));

    console.log('Final sentiment result:', sentimentResult);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          sentiment: sentimentResult.sentiment,
          confidence: sentimentResult.confidence,
          reasoning: sentimentResult.reasoning,
          method: 'llm',
          model: 'gemini-3-flash-preview',
          text: truncatedText.slice(0, 200) + (truncatedText.length > 200 ? '...' : ''),
          probabilities: {
            positif: sentimentResult.sentiment === 'positif' ? sentimentResult.confidence : (1 - sentimentResult.confidence) / 2,
            negatif: sentimentResult.sentiment === 'negatif' ? sentimentResult.confidence : (1 - sentimentResult.confidence) / 2,
            netral: sentimentResult.sentiment === 'netral' ? sentimentResult.confidence : (1 - sentimentResult.confidence) / 2,
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in LLM sentiment analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Gagal menganalisis sentimen';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
