import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from './promt';

export async function POST(request: Request) {
	try {
		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) {
			return NextResponse.json(
				{ error: 'OPENAI_API_KEY no configurada' },
				{ status: 500 }
			);
		}

		const body = await request.json();
		const { messages } = body as { messages: { role: string; content: string }[] };
		if (!Array.isArray(messages) || messages.length === 0) {
			return NextResponse.json(
				{ error: 'Se requiere un array de mensajes' },
				{ status: 400 }
			);
		}

		const planPath = join(process.cwd(), 'src', 'files', 'unai.md');
		const planContent = readFileSync(planPath, 'utf-8');
		const systemContent = SYSTEM_PROMPT + planContent;

		const openaiMessages = [
			{ role: 'system' as const, content: systemContent },
			...messages.map((m: { role: string; content: string }) => ({
				role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
				content: m.content
			}))
		];

		const res = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: 'gpt-4o-mini',
				messages: openaiMessages,
				max_tokens: 1024
			})
		});

		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			return NextResponse.json(
				{ error: (err as { error?: { message?: string } })?.error?.message || res.statusText },
				{ status: res.status }
			);
		}

		const data = (await res.json()) as {
			choices?: { message?: { content?: string } }[];
		};
		const content = data.choices?.[0]?.message?.content ?? 'No pude generar una respuesta.';

		return NextResponse.json({ content });
	} catch (e) {
		console.error('Chat API error:', e);
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : 'Error en el servidor' },
			{ status: 500 }
		);
	}
}
