export default {
    async fetch(request, env) {
        const { token, gemini_api_key, admin_ids } = env;
        const url = new URL(request.url);

        if (url.pathname !== "/discord") return new Response("Not Found", { status: 404 });

        const data = await request.json();

        // Verify it's a Discord message event
        if (!data || !data.content || !data.author) return new Response("Ignored", { status: 200 });

        const botMention = `<@${data.application_id}>`;
        const isMentioned = data.content.includes(botMention);
        const isAdmin = admin_ids.includes(data.author.id);

        // AI Response when bot is mentioned
        if (isMentioned) {
            const query = data.content.replace(botMention, "").trim();
            const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${gemini_api_key}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: query }] }] })
            }).then(res => res.json());

            const reply = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't process that.";

            return new Response(JSON.stringify({ content: reply }), { headers: { "Content-Type": "application/json" } });
        }

        // Admin Commands
        if (isAdmin) {
            if (data.content.startsWith("!clear")) return new Response(JSON.stringify({ content: "Clearing messages..." }));
            if (data.content.startsWith("!mute")) return new Response(JSON.stringify({ content: "Muting user..." }));
        }

        return new Response("OK", { status: 200 });
    }
};
