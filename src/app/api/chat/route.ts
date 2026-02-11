import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from './promt';

export type NutritionPlan = 'unai' | 'marifeli' | 'both';

function loadPlanContent(plan: NutritionPlan): string {
	const filesDir = join(process.cwd(), 'src', 'files');

	if (plan === 'unai') {
		const planPath = join(filesDir, 'unai.md');
		return readFileSync(planPath, 'utf-8');
	} else if (plan === 'marifeli') {
		const planPath = join(filesDir, 'marifeli.md');
		return readFileSync(planPath, 'utf-8');
	} else {
		// Both plans
		const unaiPath = join(filesDir, 'unai.md');
		const marifeliPath = join(filesDir, 'marifeli.md');
		const unaiContent = readFileSync(unaiPath, 'utf-8');
		const marifeliContent = readFileSync(marifeliPath, 'utf-8');
		return `PLAN DE UNAI:\n${unaiContent}\n\n---\n\nPLAN DE MARI FELI:\n${marifeliContent}`;
	}
}

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
		const { messages, plan = 'unai' } = body as { messages: { role: string; content: string }[]; plan: NutritionPlan };
		if (!Array.isArray(messages) || messages.length === 0) {
			return NextResponse.json(
				{ error: 'Se requiere un array de mensajes' },
				{ status: 400 }
			);
		}

		const planContent = loadPlanContent(plan);
		const planLabel = plan === 'both' ? 'Ambos planes' : plan === 'unai' ? 'Plan Unai' : 'Plan Mari Feli';
		const systemContent = SYSTEM_PROMPT + '\n\n' + planContent + '\n\n[INFO: Usando ' + planLabel + ']';

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

		return NextResponse.json({ content, plan, planLabel });
	} catch (e) {
		console.error('Chat API error:', e);
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : 'Error en el servidor' },
			{ status: 500 }
		);
	}
}
